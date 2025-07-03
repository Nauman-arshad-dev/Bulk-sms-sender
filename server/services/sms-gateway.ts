import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import { EventEmitter } from "events";

export interface SmsGatewayConfig {
  port: string;
  baudRate: number;
  simPin?: string;
}

export interface SmsMessage {
  phone: string;
  message: string;
  id?: string;
}

export interface SmsStatus {
  id: string;
  status: "sent" | "delivered" | "failed";
  timestamp: Date;
  error?: string;
}

export class SmsGateway extends EventEmitter {
  private serialPort?: SerialPort;
  private parser?: ReadlineParser;
  private isConnected = false;
  private messageQueue: SmsMessage[] = [];
  private rateLimitDelay = 1000; // 1 second between messages
  private processingQueue = false;
  
  constructor(private config: SmsGatewayConfig) {
    super();
  }

  async connect(): Promise<boolean> {
    try {
      this.serialPort = new SerialPort({
        path: this.config.port,
        baudRate: this.config.baudRate,
        autoOpen: false,
      });

      this.parser = this.serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

      return new Promise((resolve, reject) => {
        this.serialPort!.open((err) => {
          if (err) {
            reject(err);
            return;
          }

          this.setupEventHandlers();
          this.initializeModem()
            .then(() => {
              this.isConnected = true;
              this.emit('connected');
              resolve(true);
            })
            .catch(reject);
        });
      });
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }

  private setupEventHandlers(): void {
    if (!this.parser) return;

    this.parser.on('data', (data: string) => {
      this.handleResponse(data);
    });

    this.serialPort?.on('error', (error) => {
      this.emit('error', error);
      this.isConnected = false;
    });

    this.serialPort?.on('close', () => {
      this.isConnected = false;
      this.emit('disconnected');
    });
  }

  private async initializeModem(): Promise<void> {
    try {
      // Basic AT commands to initialize the modem
      await this.sendCommand('AT'); // Check if modem is responding
      await this.sendCommand('AT+CMGF=1'); // Set SMS text mode
      await this.sendCommand('AT+CNMI=1,2,0,1,0'); // Set SMS notification mode
      
      // Set SIM PIN if provided
      if (this.config.simPin) {
        await this.sendCommand(`AT+CPIN=${this.config.simPin}`);
      }

      // Check signal strength
      const signal = await this.sendCommand('AT+CSQ');
      this.emit('signalStrength', this.parseSignalStrength(signal));

      // Get network registration status
      await this.sendCommand('AT+CREG?');
      
      // Get SIM card info
      const simInfo = await this.sendCommand('AT+CIMI');
      this.emit('simInfo', simInfo);

    } catch (error) {
      throw new Error(`Failed to initialize modem: ${error}`);
    }
  }

  private sendCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.serialPort || !this.isConnected) {
        reject(new Error('Modem not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Command timeout: ${command}`));
      }, 10000);

      const responseHandler = (data: string) => {
        clearTimeout(timeout);
        if (data.includes('OK')) {
          resolve(data);
        } else if (data.includes('ERROR')) {
          reject(new Error(`Command failed: ${command} - ${data}`));
        }
      };

      this.once('response', responseHandler);
      this.serialPort.write(command + '\r\n');
    });
  }

  private handleResponse(data: string): void {
    // Handle incoming SMS delivery reports
    if (data.startsWith('+CDSI:')) {
      this.handleDeliveryReport(data);
      return;
    }

    // Handle incoming SMS messages
    if (data.startsWith('+CMTI:')) {
      this.handleIncomingSms(data);
      return;
    }

    // Emit general response
    this.emit('response', data);
  }

  private handleDeliveryReport(data: string): void {
    // Parse delivery report and emit status
    const match = data.match(/\+CDSI: "(\w+)",(\d+)/);
    if (match) {
      const [, storage, index] = match;
      // Read the delivery report
      this.readDeliveryReport(parseInt(index));
    }
  }

  private async readDeliveryReport(index: number): Promise<void> {
    try {
      const report = await this.sendCommand(`AT+CMGR=${index}`);
      // Parse the delivery report and emit status
      this.emit('deliveryReport', this.parseDeliveryReport(report));
    } catch (error) {
      this.emit('error', error);
    }
  }

  private handleIncomingSms(data: string): void {
    // Handle incoming SMS (for opt-out messages)
    const match = data.match(/\+CMTI: "(\w+)",(\d+)/);
    if (match) {
      const [, storage, index] = match;
      this.readIncomingSms(parseInt(index));
    }
  }

  private async readIncomingSms(index: number): Promise<void> {
    try {
      const sms = await this.sendCommand(`AT+CMGR=${index}`);
      const parsed = this.parseIncomingSms(sms);
      if (parsed && this.isOptOutMessage(parsed.message)) {
        this.emit('optOut', parsed.phone);
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  private parseSignalStrength(response: string): number {
    const match = response.match(/\+CSQ: (\d+),/);
    return match ? parseInt(match[1]) : 0;
  }

  private parseDeliveryReport(report: string): SmsStatus {
    // Parse delivery report format
    // This is a simplified parser - actual implementation depends on modem
    const lines = report.split('\n');
    const statusLine = lines.find(line => line.includes('+CMGR:'));
    
    return {
      id: 'unknown',
      status: 'delivered',
      timestamp: new Date(),
    };
  }

  private parseIncomingSms(sms: string): { phone: string; message: string } | null {
    // Parse incoming SMS format
    const lines = sms.split('\n');
    const headerLine = lines.find(line => line.includes('+CMGR:'));
    
    if (!headerLine) return null;
    
    const phoneMatch = headerLine.match(/"([+\d]+)"/);
    const messageLine = lines[lines.indexOf(headerLine) + 1];
    
    if (!phoneMatch || !messageLine) return null;
    
    return {
      phone: phoneMatch[1],
      message: messageLine.trim(),
    };
  }

  private isOptOutMessage(message: string): boolean {
    const optOutKeywords = ['STOP', 'UNSUBSCRIBE', 'OPT OUT', 'REMOVE'];
    return optOutKeywords.some(keyword => 
      message.toUpperCase().includes(keyword)
    );
  }

  async sendSms(phone: string, message: string): Promise<string> {
    if (!this.isConnected) {
      throw new Error('SMS Gateway not connected');
    }

    try {
      // Send SMS using AT commands
      await this.sendCommand(`AT+CMGS="${phone}"`);
      await this.sendCommand(message + '\x1A'); // End with Ctrl+Z
      
      const messageId = Date.now().toString();
      this.emit('smsSent', { id: messageId, phone, message });
      
      return messageId;
    } catch (error) {
      throw new Error(`Failed to send SMS: ${error}`);
    }
  }

  queueMessage(message: SmsMessage): void {
    this.messageQueue.push(message);
    if (!this.processingQueue) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.messageQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      
      try {
        const messageId = await this.sendSms(message.phone, message.message);
        this.emit('messageProcessed', { ...message, id: messageId, status: 'sent' });
      } catch (error) {
        this.emit('messageProcessed', { ...message, status: 'failed', error: error.message });
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
    }

    this.processingQueue = false;
  }

  async getStatus(): Promise<{
    connected: boolean;
    signalStrength: number;
    simProvider: string;
    queueLength: number;
  }> {
    let signalStrength = 0;
    let simProvider = 'Unknown';

    if (this.isConnected) {
      try {
        const signal = await this.sendCommand('AT+CSQ');
        signalStrength = this.parseSignalStrength(signal);
        
        // Try to get network operator name
        const operator = await this.sendCommand('AT+COPS?');
        const operatorMatch = operator.match(/\+COPS: \d+,\d+,"([^"]+)"/);
        if (operatorMatch) {
          simProvider = operatorMatch[1];
        }
      } catch (error) {
        // Continue with default values if commands fail
      }
    }

    return {
      connected: this.isConnected,
      signalStrength,
      simProvider,
      queueLength: this.messageQueue.length,
    };
  }

  disconnect(): void {
    if (this.serialPort && this.serialPort.isOpen) {
      this.serialPort.close();
    }
    this.isConnected = false;
  }
}

// Default configuration for common USB SMS modems
export const defaultGatewayConfig: SmsGatewayConfig = {
  port: process.env.SMS_GATEWAY_PORT || '/dev/ttyUSB0',
  baudRate: 115200,
  simPin: process.env.SIM_PIN,
};

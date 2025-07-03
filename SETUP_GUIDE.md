# SMS Bulk Sender - Local Setup Guide

## Overview
This guide explains how to set up the SMS bulk sender application on your local PC and test it with your Lyca SIM card using SMS gateway hardware.

## System Requirements

### Software Requirements
- **Node.js 18+** (https://nodejs.org/)
- **Git** (https://git-scm.com/)
- **Code Editor** (VS Code recommended)

### Hardware Requirements for SMS Gateway
Since your client already has a Lyca SIM card with SMS plan, you'll need ONE of these USB SMS modems:

#### Recommended USB SMS Modems
1. **Huawei E3372** (€25-40)
   - 4G LTE USB dongle
   - Excellent compatibility
   - Works with most carriers including Lyca
   - Easy setup on Windows/Linux

2. **ZTE MF79U** (€30-45)
   - 4G LTE USB modem
   - High-speed SMS sending
   - Reliable connection
   - Good signal strength

3. **Huawei E3531** (€20-35)
   - 3G/4G USB modem
   - Budget-friendly option
   - Wide compatibility

## Step 1: Download and Setup Project

### Clone the Project
```bash
# Download project from Replit
git clone <your-replit-git-url> sms-bulk-sender
cd sms-bulk-sender

# Install dependencies
npm install
```

### Environment Configuration
Create a `.env` file in the root directory:
```bash
# Database (optional - uses in-memory storage by default)
DATABASE_URL=postgresql://username:password@localhost:5432/sms_app

# SMS Gateway Configuration
SMS_GATEWAY_PORT=/dev/ttyUSB0  # Linux/Mac
# SMS_GATEWAY_PORT=COM3        # Windows
SIM_PIN=1234                   # If your SIM has a PIN

# Development
NODE_ENV=development
```

## Step 2: Hardware Setup

### For Your Lyca SIM Setup:

1. **Remove SIM from Phone**
   - Carefully remove the Lyca SIM card from your client's phone
   - Note: The phone will lose SMS capability while SIM is in the modem

2. **Insert SIM into USB Modem**
   - Open the USB modem (usually slides open)
   - Insert the Lyca SIM card
   - Ensure proper orientation (cut corner matches)
   - Close the modem securely

3. **Connect USB Modem**
   - Plug USB modem into computer
   - Wait for drivers to install automatically
   - Check Device Manager (Windows) or `lsusb` (Linux) to verify detection

### Finding the Correct Port

#### Windows:
1. Open Device Manager
2. Look for "Ports (COM & LPT)"
3. Find your modem (usually COM3, COM4, etc.)
4. Update `.env` file: `SMS_GATEWAY_PORT=COM3`

#### Linux/Mac:
1. Run: `ls /dev/ttyUSB*` or `ls /dev/ttyACM*`
2. Usually shows as `/dev/ttyUSB0` or `/dev/ttyUSB1`
3. Update `.env` file: `SMS_GATEWAY_PORT=/dev/ttyUSB0`

## Step 3: Running the Application

### Start Development Server
```bash
npm run dev
```

The application will start on `http://localhost:5000`

### Initial Setup
1. **Check Gateway Status**
   - Go to "SMS Gateway Setup" page
   - Click "Check Status" button
   - Verify connection and signal strength

2. **Import Contacts**
   - Go to "Contact Lists" page
   - Create a new contact list
   - Import contacts via CSV or add manually

3. **Test SMS Sending**
   - Go to "Compose Message" page
   - Select your contact list
   - Write a test message
   - Send to a small group first (2-3 contacts)

## Step 4: Testing Strategy

### Phase 1: Hardware Testing
1. **Signal Test**: Ensure strong signal (15+ on 31 scale)
2. **Single SMS Test**: Send one SMS to your own number
3. **Response Test**: Verify SMS delivery and replies

### Phase 2: Small Batch Testing
1. **Test with 5 contacts**: Friends/family who consent to testing
2. **Verify delivery**: Check delivery reports
3. **Test opt-out**: Ensure "STOP" replies work

### Phase 3: Production Testing
1. **50 contact test**: Small subset of real customers
2. **Monitor responses**: Check for delivery failures
3. **Compliance check**: Ensure GDPR compliance

## Important Considerations

### SIM Card Usage
- **One device at a time**: SIM can only be in phone OR modem, not both
- **SMS plan**: Ensure unlimited SMS plan is active
- **Credit monitoring**: Check remaining SMS credits regularly
- **Network coverage**: Test in area with good Lyca signal

### Legal Compliance
- **GDPR Consent**: Only message customers who opted in
- **Opt-out mechanism**: Always include "Reply STOP to opt out"
- **Business identification**: Include business name in messages
- **Timing**: Don't send outside business hours (9 AM - 6 PM)

### Rate Limiting
- **Default limit**: 1 SMS per second (3,600/hour)
- **Carrier limits**: Lyca may have additional limits
- **Batch processing**: Large campaigns sent gradually

## Troubleshooting

### Common Issues

#### "Gateway Not Connecting"
1. **Check USB connection**: Try different USB port
2. **Driver issues**: Install modem drivers manually
3. **Port permissions**: On Linux, add user to dialout group:
   ```bash
   sudo usermod -a -G dialout $USER
   # Logout and login again
   ```

#### "No Signal" or "Poor Signal"
1. **Location**: Move modem near window
2. **USB extension**: Use USB extension cable for better positioning
3. **Antenna**: Some modems support external antenna

#### "SIM Not Detected"
1. **SIM insertion**: Ensure SIM is properly inserted
2. **SIM PIN**: Check if PIN is required and set correctly
3. **SIM activation**: Verify SIM is active with carrier

#### "Messages Not Sending"
1. **Credit check**: Verify SMS credits available
2. **Number format**: Ensure phone numbers include country code (+31 for Netherlands)
3. **Content issues**: Avoid special characters that may cause encoding issues

### Testing Commands

#### Check SMS Gateway Status
```bash
# Using curl to test API
curl http://localhost:5000/api/gateway/status
```

#### View Logs
```bash
# Application logs
npm run dev

# Check for errors in browser console (F12)
```

## Production Deployment

### When Ready for Production:
1. **Deploy to cloud**: Use Replit Deployments or similar
2. **Secure environment**: Set proper environment variables
3. **Database**: Switch to PostgreSQL for persistence
4. **Monitoring**: Set up logging and monitoring
5. **Backup**: Regular database backups

### Environment Variables for Production:
```bash
NODE_ENV=production
DATABASE_URL=your_production_database_url
SMS_GATEWAY_PORT=your_modem_port
SIM_PIN=your_sim_pin
```

## Support and Maintenance

### Regular Maintenance:
- **Monitor delivery rates**: Check for declining performance
- **Update contact lists**: Remove bounced numbers
- **Check compliance**: Regular GDPR compliance reviews
- **Hardware maintenance**: Clean USB connections, check signal

### Getting Help:
- **Application logs**: Check console for error messages
- **Gateway status**: Use built-in status monitoring
- **Test mode**: Use preview feature before sending

## Cost Considerations

### Hardware Costs:
- **USB Modem**: €20-45 (one-time)
- **SIM Plan**: Your existing Lyca unlimited SMS plan
- **Total setup**: Under €50 plus existing SIM costs

### Operational Costs:
- **SMS sending**: Covered by your Lyca unlimited plan
- **Electricity**: Minimal (USB modem power)
- **Internet**: Standard broadband connection

This setup allows you to send bulk SMS messages using your existing Lyca SIM card and unlimited SMS plan, eliminating per-message costs while maintaining professional messaging capabilities.
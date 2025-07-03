import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { type Contact, type InsertContact } from "@shared/schema";

export interface CsvContact {
  name: string;
  phone: string;
  email?: string;
}

export interface CsvProcessResult {
  contacts: CsvContact[];
  errors: string[];
  duplicates: string[];
}

export class CsvProcessor {
  static async processContactsCsv(csvData: string, listId?: number): Promise<CsvProcessResult> {
    const result: CsvProcessResult = {
      contacts: [],
      errors: [],
      duplicates: []
    };

    try {
      const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: true
      });

      const seenPhones = new Set<string>();

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const rowNumber = i + 2; // +2 because of header and 0-based index

        try {
          const contact = this.validateAndNormalizeContact(record, rowNumber);
          
          // Check for duplicates within the CSV
          if (seenPhones.has(contact.phone)) {
            result.duplicates.push(`Row ${rowNumber}: Phone ${contact.phone} already exists in this file`);
            continue;
          }

          seenPhones.add(contact.phone);
          result.contacts.push(contact);

        } catch (error) {
          result.errors.push(`Row ${rowNumber}: ${error.message}`);
        }
      }

    } catch (error) {
      result.errors.push(`CSV parsing error: ${error.message}`);
    }

    return result;
  }

  private static validateAndNormalizeContact(record: any, rowNumber: number): CsvContact {
    const errors: string[] = [];

    // Validate name
    const name = this.normalizeString(record.name || record.Name || record.NAME);
    if (!name) {
      errors.push("Name is required");
    }

    // Validate phone
    const phone = this.normalizePhone(record.phone || record.Phone || record.PHONE);
    if (!phone) {
      errors.push("Phone is required");
    } else if (!this.isValidPhone(phone)) {
      errors.push("Invalid phone number format");
    }

    // Optional email
    const email = this.normalizeEmail(record.email || record.Email || record.EMAIL);
    if (email && !this.isValidEmail(email)) {
      errors.push("Invalid email format");
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }

    return {
      name: name!,
      phone: phone!,
      email: email || undefined
    };
  }

  private static normalizeString(value: any): string | null {
    if (typeof value !== 'string') return null;
    return value.trim() || null;
  }

  private static normalizePhone(value: any): string | null {
    if (typeof value !== 'string') return null;
    
    // Remove all non-digit characters except +
    let phone = value.replace(/[^\d+]/g, '');
    
    // Add + prefix if missing and number starts with country code
    if (!phone.startsWith('+') && phone.length > 10) {
      phone = '+' + phone;
    }
    
    // Add +31 for Dutch numbers if missing country code
    if (!phone.startsWith('+') && phone.length === 10) {
      phone = '+31' + phone;
    }

    return phone || null;
  }

  private static normalizeEmail(value: any): string | null {
    if (typeof value !== 'string') return null;
    return value.trim().toLowerCase() || null;
  }

  private static isValidPhone(phone: string): boolean {
    // Basic phone validation - starts with + and has 10-15 digits
    return /^\+\d{10,15}$/.test(phone);
  }

  private static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static exportContactsToCsv(contacts: Contact[]): string {
    const csvData = contacts.map(contact => ({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || '',
      opted_in: contact.optedIn ? 'Yes' : 'No',
      blacklisted: contact.blacklisted ? 'Yes' : 'No',
      created_at: contact.createdAt?.toISOString() || ''
    }));

    return stringify(csvData, {
      header: true,
      columns: {
        name: 'Name',
        phone: 'Phone',
        email: 'Email',
        opted_in: 'Opted In',
        blacklisted: 'Blacklisted',
        created_at: 'Created At'
      }
    });
  }

  static generateCsvTemplate(): string {
    const template = [
      { name: 'John Doe', phone: '+31612345678', email: 'john@example.com' },
      { name: 'Jane Smith', phone: '+31687654321', email: 'jane@example.com' }
    ];

    return stringify(template, {
      header: true,
      columns: {
        name: 'Name',
        phone: 'Phone',
        email: 'Email'
      }
    });
  }
}

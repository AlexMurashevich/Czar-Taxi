import * as XLSX from 'xlsx';
import { storage } from '../storage';
import { z } from 'zod';

interface ProcessingResult {
  processedRows: number;
  errors: Array<{ row: number; error: string; data?: any }>;
}

class XLSXProcessor {
  async processFile(filePath: string, importId: number): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      processedRows: 0,
      errors: []
    };

    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('No sheets found in the workbook');
      }

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error('No data found in the worksheet');
      }

      // Validate structure - first row should have 'phone' column and date columns
      const firstRow = jsonData[0] as any;
      const columns = Object.keys(firstRow);
      
      if (!columns.includes('phone')) {
        throw new Error('Phone column not found. Expected column name: "phone"');
      }

      const dateColumns = columns.filter(col => col !== 'phone');
      if (dateColumns.length === 0) {
        throw new Error('No date columns found');
      }

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        const rowNumber = i + 2; // Excel row numbers start from 1, plus header

        try {
          const phone = this.normalizePhone(row.phone);
          if (!phone) {
            result.errors.push({
              row: rowNumber,
              error: 'Invalid phone number',
              data: row.phone
            });
            continue;
          }

          // Find or create user
          let user = await storage.getUserByPhone(phone);
          if (!user) {
            result.errors.push({
              row: rowNumber,
              error: 'User not found in system',
              data: phone
            });
            continue;
          }

          // Process hours for each date column
          for (const dateCol of dateColumns) {
            const hoursValue = row[dateCol];
            if (hoursValue === undefined || hoursValue === null || hoursValue === '') {
              continue; // Skip empty cells
            }

            const hours = this.parseHours(hoursValue);
            if (hours === null) {
              result.errors.push({
                row: rowNumber,
                error: `Invalid hours value in column ${dateCol}`,
                data: hoursValue
              });
              continue;
            }

            const workDate = this.parseDate(dateCol);
            if (!workDate) {
              result.errors.push({
                row: rowNumber,
                error: `Invalid date format in column ${dateCol}`,
                data: dateCol
              });
              continue;
            }

            // Check for anomalies
            if (hours > 16) {
              result.errors.push({
                row: rowNumber,
                error: `Suspicious hours value (>${16}h) for ${workDate}`,
                data: { phone, date: workDate, hours }
              });
              // Continue processing despite the warning
            }

            // Upsert hours record
            await storage.upsertHoursRaw({
              userId: user.id,
              workDate,
              hours: hours.toString(),
              importId
            });
          }

          result.processedRows++;

        } catch (rowError: any) {
          result.errors.push({
            row: rowNumber,
            error: `Row processing failed: ${rowError.message}`,
            data: row
          });
        }
      }

    } catch (error: any) {
      throw new Error(`File processing failed: ${error.message}`);
    }

    return result;
  }

  private normalizePhone(phone: any): string | null {
    if (!phone) return null;
    
    const phoneStr = phone.toString().trim();
    const digits = phoneStr.replace(/\D/g, '');
    
    if (digits.length < 10) return null;
    
    // Handle Russian phone numbers
    if (digits.startsWith('8') && digits.length === 11) {
      return '+7' + digits.slice(1);
    }
    if (digits.startsWith('7') && digits.length === 11) {
      return '+' + digits;
    }
    if (digits.length === 10) {
      return '+7' + digits;
    }
    
    return '+' + digits;
  }

  private parseHours(value: any): number | null {
    if (value === undefined || value === null || value === '') return null;
    
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) return null;
    
    return numValue;
  }

  private parseDate(dateStr: string): string | null {
    try {
      // Try parsing as Excel serial date number
      const excelDate = Number(dateStr);
      if (!isNaN(excelDate) && excelDate > 0) {
        const date = XLSX.SSF.parse_date_code(excelDate);
        if (date) {
          return `${date.y}-${date.m.toString().padStart(2, '0')}-${date.d.toString().padStart(2, '0')}`;
        }
      }

      // Try parsing as ISO date string
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }

      // Try parsing date formats like DD.MM.YYYY or DD/MM/YYYY
      const datePatterns = [
        /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/
      ];

      for (const pattern of datePatterns) {
        const match = dateStr.match(pattern);
        if (match) {
          let day, month, year;
          if (pattern.source.startsWith('^(\\d{4})')) {
            [, year, month, day] = match;
          } else {
            [, day, month, year] = match;
          }
          
          const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString().split('T')[0];
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}

export const xlsxProcessor = new XLSXProcessor();

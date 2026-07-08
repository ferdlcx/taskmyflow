import type { FinanceSummary } from './types';

/**
 * Fetch finance summary data from a public Google Sheets CSV URL.
 * Expected CSV format (header + 1 row of data):
 * Total Balance,Income Month,Expense Month
 * 10000.50,5000.00,2000.00
 * 
 * @param sheetUrl The public Google Sheets CSV URL
 * @returns A parsed FinanceSummary object
 */
export async function fetchFinanceSummary(sheetUrl: string): Promise<FinanceSummary> {
  try {
    const response = await fetch(sheetUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheet data: ${response.statusText}`);
    }
    
    const csvData = await response.text();
    
    // Simple CSV parser for a known 2-row format (header + data)
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
      throw new Error('CSV data does not contain expected data row.');
    }
    
    // Parse the second line (index 1) which contains the data
    const dataRow = lines[1].split(',').map(val => {
      // Remove surrounding quotes if present and trim
      let cleanVal = val.trim();
      if (cleanVal.startsWith('"') && cleanVal.endsWith('"')) {
        cleanVal = cleanVal.substring(1, cleanVal.length - 1);
      }
      return parseFloat(cleanVal);
    });
    
    if (dataRow.length < 3) {
      throw new Error('CSV data row does not contain enough columns.');
    }
    
    return {
      total_balance: isNaN(dataRow[0]) ? 0 : dataRow[0],
      income_month: isNaN(dataRow[1]) ? 0 : dataRow[1],
      expense_month: isNaN(dataRow[2]) ? 0 : dataRow[2],
      last_synced: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching finance summary:', error);
    throw error;
  }
}

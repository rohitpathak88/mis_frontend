export interface DashboardSummary {
    totalLoans: number;
    totalDisbursement: number | string;
    averageLoanAmount: number | string;
    totalCashback: number | string;
    totalSubvention: number | string;
}

export interface DashboardBreakdown {
    name: string;
    loans: number;
    amount: number | string;
}

export interface DashboardData {
    summary: DashboardSummary;
    bankWise: DashboardBreakdown[];
    productWise: DashboardBreakdown[];
    teamWise: DashboardBreakdown[];
    sellerWise: DashboardBreakdown[];
    cityWise: DashboardBreakdown[];
}

export interface MisRecord {
    id: number;
    customerName: string;
    contactNumber?: string;
    employerName?: string;
    bankName?: string;
    city?: string;
    product?: string;
    loanAccountNo: string;
    disbursementAmount: number | string;
    disbursementMonth: string;
    sellerName?: string;
    teamName?: string;
    dsaCode?: string;
    cashback: number | string;
    subvention: number | string;
    importId?: number;
    createdAt?: string;
}
export interface User {
  userId: string;
  name: string;
}

export interface DatabaseCredentials {
  type: 'postgresql' | 'mysql' | 'sqlite';
  connectionString?: string;
  host?: string;
  port?: string;
  database?: string;
  username?: string;
  password?: string;
}

export interface QueryResult {
  naturalLanguageOutput: string;
  visualizationData?: ChartData;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie';
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

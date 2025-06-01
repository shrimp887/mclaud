// src/app/mitre/components/types.d.ts

// OpenSearch에서 반환된 date_histogram 버킷
export interface LogBucket {
  key_as_string: string;
  doc_count: number;
}

// 시계열 그래프에 표시할 로그 집계 데이터
export interface SeriesData {
  timestamp: string;
  aws?: number;
  azure?: number;
  gcp?: number;
  alert?: boolean;
}

// 각 인덱스별 응답 구조
export interface ApiResponseEntry {
  index: string;
  buckets: LogBucket[];
}

// 웹훅으로 들어온 경고 데이터 구조
export interface AlertData {
  timestamp: string;
  trigger: string;
  cloud: string;
}


import { NextRequest } from "next/server";
import { Client } from "@opensearch-project/opensearch";

// OpenSearch 클라이언트 설정
const client = new Client({
  node: "http://34.64.61.205:9200",
  auth: {
    username: "admin",
    password: "admin",
  },
});

interface LogBucket {
  key_as_string: string;
  doc_count: number;
}

interface LogsAggResponse {
  aggregations?: {
    logs_over_time?: {
      buckets?: LogBucket[];
    };
  };
}

interface ApiResponseEntry {
  index: string;
  buckets: LogBucket[];
}

export async function GET(req: NextRequest) {
  try {
    const indices = ["aws-logs", "azure-logs", "gcp-logs"];

    // query string에서 시작/끝 시간 가져오기
    const startParam = req.nextUrl.searchParams.get("start");
    const endParam = req.nextUrl.searchParams.get("end");

    if (!startParam) {
      return new Response(
        JSON.stringify({ error: "start 파라미터가 필요합니다." }),
        { status: 400 }
      );
    }

    const start = new Date(startParam);
    const end = endParam ? new Date(endParam) : new Date(); // end 생략 시 현재 시간

    const results: ApiResponseEntry[] = await Promise.all(
      indices.map(async (index) => {
        const res = await client.search({
          index,
          size: 0,
          body: {
            query: {
              range: {
                "@timestamp": {
                  gte: start.toISOString(),
                  lte: end.toISOString(),
                  format: "strict_date_optional_time",
                },
              },
            },
            aggs: {
              logs_over_time: {
                date_histogram: {
                  field: "@timestamp",
                  fixed_interval: "1s", // 1초 간격 버킷
                  min_doc_count: 0,
                  extended_bounds: {
                    min: start.toISOString(),
                    max: end.toISOString(),
                  },
                },
              },
            },
          },
        });

        const body = res.body as LogsAggResponse;
        const buckets = body.aggregations?.logs_over_time?.buckets ?? [];

        return { index, buckets };
      })
    );

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("OpenSearch query error:", err);
    return new Response(JSON.stringify({ error: "Query failed" }), {
      status: 500,
    });
  }
}

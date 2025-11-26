import http from 'k6/http';
import { check, sleep } from 'k6';

const DEFAULT_VUS = 10;
const DEFAULT_DURATION = '20s';

const vus = __ENV.K6_VUS ? parseInt(__ENV.K6_VUS) : DEFAULT_VUS;
const duration = __ENV.K6_DURATION || DEFAULT_DURATION;

export let options = {
  vus: vus,
  duration: duration,
  thresholds: {
    // 95% das requisições em menos que 500ms
    'http_req_duration': ['p(95)<500'],
    // menos de 1% de requisições com falha
    'http_req_failed': ['rate<0.01'],
  },
};

const url = __ENV.TARGET_URL || 'http://localhost:5000/';

export default function () {
  const res = http.get(url);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}

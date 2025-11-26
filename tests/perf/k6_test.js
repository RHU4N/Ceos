import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 10,
  duration: '20s',
};

const url = __ENV.TARGET_URL || 'http://localhost:5000/';

export default function () {
  const res = http.get(url);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}

// Lets Node's test runner import app files written for Metro (no ".ts" on imports).
import { register } from 'node:module';

register(
  'data:text/javascript,' +
    encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  try { return await next(spec, ctx); }
  catch (e) {
    if (spec.startsWith('.') && !/\\.[cm]?[jt]sx?$/.test(spec)) return next(spec + '.ts', ctx);
    throw e;
  }
}`),
);

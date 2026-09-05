import { strict as assert } from "node:assert";
import { test, describe } from "node:test";
import { parseCsv } from "./client";

describe("parseCsv", () => {
  test("reads a headered export and maps the columns by name", () => {
    const rows = parseCsv("date,description,amount\n2026-06-01,BLUE BOTTLE,7.25\n2026-06-02,MARKET,18.00");
    assert.deepEqual(rows, [
      { date: "2026-06-01", name: "BLUE BOTTLE", amount: 7.25 },
      { date: "2026-06-02", name: "MARKET", amount: 18 },
    ]);
  });

  test("normalises US M/D/YYYY and two-digit years", () => {
    const rows = parseCsv("date,description,amount\n6/1/2026,A,5\n7/4/26,B,6");
    assert.equal(rows[0].date, "2026-06-01");
    assert.equal(rows[1].date, "2026-07-04");
  });

  test("keeps commas inside quoted fields together", () => {
    const rows = parseCsv('date,description,amount\n2026-06-01,"SPLIT DINNER, ALEX",24.50');
    assert.equal(rows[0].name, "SPLIT DINNER, ALEX");
    assert.equal(rows[0].amount, 24.5);
  });

  test("strips currency symbols and treats debits as positive spend", () => {
    const rows = parseCsv("date,description,amount\n2026-06-01,A,\"$1,234.50\"\n2026-06-02,B,-40.00");
    assert.equal(rows[0].amount, 1234.5);
    assert.equal(rows[1].amount, 40);
  });

  test("skips rows with an unusable date or amount", () => {
    const rows = parseCsv("date,description,amount\nnot-a-date,A,5\n2026-06-01,B,\n2026-06-02,C,9");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, "C");
  });

  test("handles a headerless file positionally", () => {
    const rows = parseCsv("2026-06-01,COFFEE,4.50");
    assert.deepEqual(rows, [{ date: "2026-06-01", name: "COFFEE", amount: 4.5 }]);
  });

  test("returns nothing for empty input", () => {
    assert.deepEqual(parseCsv(""), []);
    assert.deepEqual(parseCsv("\n\n"), []);
  });
});

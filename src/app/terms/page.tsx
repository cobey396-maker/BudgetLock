import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { OPERATOR, CONTACT_EMAIL, LAST_UPDATED, GOVERNING_LAW } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The agreement between you and BudgetLock.",
};

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated={LAST_UPDATED}>
      <p>
        These terms are an agreement between you and {OPERATOR} covering your use of BudgetLock. By
        creating an account you accept them. If you do not agree, do not use the app.
      </p>

      <h2>What BudgetLock is</h2>
      <p>
        BudgetLock is a personal budgeting tool. It shows you what you have spent against a limit you
        set. It is <strong>not</strong> a bank, a money transmitter, or a financial, tax, or
        investment adviser, and it cannot block, decline, or freeze a real payment. Nothing in the app
        is financial advice.
      </p>

      <h2>Accuracy</h2>
      <p>
        Figures come from what you enter and from what your bank reports through Plaid. Imports can be
        delayed, incomplete, duplicated, or miscategorised, and pending transactions may change. Always
        check your bank or card statement before making a financial decision. We are not responsible
        for overdrafts, fees, or losses arising from relying on the app&rsquo;s numbers.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You must be at least 13 years old, and old enough to form a binding contract where you live.</li>
        <li>Give accurate sign-up details and keep your password confidential.</li>
        <li>You are responsible for activity under your account. Tell us promptly if you suspect misuse.</li>
        <li>One person per account; do not share logins.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>link financial accounts you are not authorised to access;</li>
        <li>probe, scan, or attempt to breach the service, or circumvent rate limits and authentication;</li>
        <li>scrape, resell, or redistribute the service or another user&rsquo;s data;</li>
        <li>upload unlawful content or use the app for anything illegal.</li>
      </ul>

      <h2>Bank connections</h2>
      <p>
        Linking a bank is optional and is provided through Plaid. Your use of that feature is also
        subject to Plaid&rsquo;s terms and privacy policy. You may disconnect at any time from Settings.
      </p>

      <h2>Availability and changes</h2>
      <p>
        We may change, suspend, or discontinue any part of the service. We aim to give notice of
        material changes, but the app is offered without an uptime guarantee.
      </p>

      <h2>Ending your account</h2>
      <p>
        You can stop using BudgetLock at any time and ask us to delete your account at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We may suspend or close accounts that
        breach these terms or that we must close for legal reasons.
      </p>

      <h2>Disclaimer and liability</h2>
      <p>
        The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties
        of any kind to the fullest extent the law allows. To the extent permitted by law, we are not
        liable for indirect, incidental, special, or consequential damages, or for lost profits or
        data; and our total liability for any claim relating to the service is limited to the greater
        of the amount you paid us in the twelve months before the claim, or US$50. Some jurisdictions
        do not allow these limits, in which case they apply only as far as the law permits.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of {GOVERNING_LAW}, without regard to conflict-of-law
        rules. Nothing here removes consumer rights you have that cannot be waived.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We will update the date above when these terms change and notify signed-in users of material
        changes. Continuing to use the app after a change means you accept the revised terms.
      </p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </LegalPage>
  );
}

import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { OPERATOR, CONTACT_EMAIL, LAST_UPDATED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What BudgetLock collects, why, and how to delete it.",
};

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated={LAST_UPDATED}>
      <p>
        BudgetLock (&ldquo;we&rdquo;, &ldquo;the app&rdquo;) is operated by {OPERATOR}. This policy
        describes what the app stores, why it stores it, and how to get rid of it. It covers the
        BudgetLock web app only.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details</strong> — the name and email address you enter at sign-up, and a
          bcrypt hash of your password. We never store your password itself and cannot recover it.
        </li>
        <li>
          <strong>Budget settings</strong> — your spending limit, budget period, category splits, and
          the questionnaire answers (income, fixed expenses, savings goal, age, goals, assets) you
          give during onboarding. These are used only to suggest a limit and to draw your gauge.
        </li>
        <li>
          <strong>Transactions</strong> — purchases you log by hand, rows you import from a CSV, and,
          if you link a bank, the transactions Plaid returns: date, amount, merchant, description,
          account identifier, and Plaid&rsquo;s category.
        </li>
        <li>
          <strong>Bank connection tokens</strong> — if you link a bank, Plaid issues an access token
          for that connection. We store it encrypted (AES-256-GCM) and use it only to fetch
          transactions.
        </li>
        <li>
          <strong>Session cookie</strong> — one strictly necessary, HTTP-only cookie that keeps you
          signed in. There are no advertising or analytics cookies.
        </li>
        <li>
          <strong>Operational logs</strong> — our hosting provider records request metadata such as
          IP address and timestamp, which we use to detect abuse and debug failures.
        </li>
      </ul>

      <h2>What we do not collect</h2>
      <p>
        We do not collect your bank login credentials — those are entered with Plaid and never reach
        our servers. We do not sell personal data, we do not share it with advertisers, and we do not
        run third-party trackers or analytics.
      </p>

      <h2>Bank data and Plaid</h2>
      <p>
        Bank connections are handled by Plaid Inc., which acts as our service provider for account
        linking and transaction retrieval. When you link an account you also agree to{" "}
        <a href="https://plaid.com/legal/#end-user-privacy-policy" rel="noreferrer noopener" target="_blank">
          Plaid&rsquo;s End User Privacy Policy
        </a>
        . You can disconnect a bank at any time from Settings; doing so stops further syncing and
        deletes the stored access token.
      </p>

      <h2>Where data lives</h2>
      <p>
        Data is stored in a managed PostgreSQL database and served from our hosting provider&rsquo;s
        infrastructure. Traffic is encrypted in transit with TLS. Access to production data is
        limited to the people who operate the service.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Account data is kept until you delete your account. Sessions expire 30 days after sign-in.
        Rate-limiting counters are discarded within an hour. Deleting your account removes your
        profile, budget, transactions, and bank connections; backups roll off within 30 days.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>
          <strong>Reset</strong> — Settings &rarr; Reset data clears your budget, questionnaire
          answers, transactions, and bank links while keeping your login.
        </li>
        <li>
          <strong>Access, correction, portability, deletion</strong> — email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will respond within 30 days.
          Depending on where you live, the GDPR or CCPA/CPRA may give you these rights by law; we
          extend them to everyone regardless.
        </li>
      </ul>

      <h2>Children</h2>
      <p>
        BudgetLock is not directed at children under 13, and we do not knowingly collect their data.
        If you believe a child has created an account, contact us and we will remove it.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes materially we will update the date above and notify signed-in users
        before the change takes effect.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or requests: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}

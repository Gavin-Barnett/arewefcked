import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/panel";

const lastUpdated = "April 2, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="space-y-8 py-2">
      <div className="max-w-4xl space-y-4">
        <Link className="text-sky text-xs uppercase tracking-[0.4em]" href="/">
          arewefcked.com
        </Link>
        <h1 className="font-semibold text-3xl text-ink tracking-tight sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="max-w-3xl text-base text-ink/68 leading-7 sm:text-lg">
          Short version: we would rather measure systemic decline than collect
          unnecessary personal data.
        </p>
        <p className="text-ink/42 text-sm uppercase tracking-[0.24em]">
          Last updated {lastUpdated}
        </p>
      </div>

      <Panel eyebrow="Overview" title="What this page covers">
        <div className="max-w-4xl space-y-5 text-base text-ink/72 leading-8">
          <p>
            This Privacy Policy explains what information may be collected when
            you use Are We Fcked?, how that information is used, and what third
            parties may process data on this site.
          </p>
          <p>
            The site is designed to present public risk data, methodology, and
            source-backed summaries. It is not intended to collect more personal
            information than is reasonably required to operate the service,
            protect it, and support advertising where enabled.
          </p>
        </div>
      </Panel>

      <Panel eyebrow="Collection" title="Information we may collect">
        <div className="max-w-4xl space-y-5 text-base text-ink/72 leading-8">
          <p>
            We may receive technical information that is commonly included in
            web requests, such as IP address, browser type, device type,
            approximate location derived from IP, referring pages, and basic
            request logs. This information may be used for security, debugging,
            abuse prevention, performance monitoring, and aggregate traffic
            analysis.
          </p>
          <p>
            If you use search, country filters, or other interactive features,
            the values you submit may be processed to return the requested
            result. We do not treat those inputs as account data because the
            site does not currently provide user accounts.
          </p>
        </div>
      </Panel>

      <Panel eyebrow="Cookies" title="Cookies and similar technologies">
        <div className="max-w-4xl space-y-5 text-base text-ink/72 leading-8">
          <p>
            This site may use cookies, local storage, and similar technologies
            to keep the site functioning, remember consent choices, improve
            performance, and support advertising.
          </p>
          <p>
            Where required by law, users in the European Economic Area, the
            United Kingdom, and Switzerland will be shown a consent message
            before ad-related storage or access is used. Consent choices can
            affect whether advertising is personalized, limited, or not served.
          </p>
        </div>
      </Panel>

      <Panel eyebrow="Advertising" title="Google AdSense">
        <div className="max-w-4xl space-y-5 text-base text-ink/72 leading-8">
          <p>
            We may use Google AdSense to display advertisements. Google and its
            partners may use cookies or similar technologies to serve ads based
            on your visit to this site and, where permitted, other sites on the
            internet.
          </p>
          <p>
            Google may use advertising cookies to help deliver and measure ads.
            Depending on your region and consent choices, ads may be
            personalized or non-personalized. More information about how Google
            uses data is available from Google at{" "}
            <a
              className="text-sky underline decoration-sky/40 underline-offset-4 transition hover:text-ink"
              href="https://policies.google.com/technologies/partner-sites"
              rel="noreferrer"
              target="_blank"
            >
              policies.google.com/technologies/partner-sites
            </a>
            .
          </p>
        </div>
      </Panel>

      <Panel eyebrow="Data Use" title="How information may be used">
        <div className="max-w-4xl space-y-5 text-base text-ink/72 leading-8">
          <p>
            Information collected through the site may be used to operate the
            service, maintain uptime, investigate failures, prevent abuse,
            improve the product, and comply with legal obligations.
          </p>
          <p>
            We may also use aggregate, non-identifying information to understand
            which pages are used and whether core product features are working
            as expected.
          </p>
        </div>
      </Panel>

      <Panel eyebrow="Third Parties" title="Third-party services">
        <div className="max-w-4xl space-y-5 text-base text-ink/72 leading-8">
          <p>
            The site depends on external infrastructure and data providers.
            Those services may process technical data such as IP address,
            request metadata, and browser information when pages are loaded or
            API requests are made.
          </p>
          <p>
            Third-party providers may include hosting, database, caching,
            content delivery, error monitoring, and advertising providers. Their
            handling of data is governed by their own terms and privacy
            policies.
          </p>
        </div>
      </Panel>

      <Panel eyebrow="Retention" title="Data retention and security">
        <div className="max-w-4xl space-y-5 text-base text-ink/72 leading-8">
          <p>
            We retain technical and operational data only for as long as it is
            reasonably needed for security, debugging, analytics, legal
            compliance, or business operations. No internet-facing service can
            promise perfect security, but reasonable administrative and
            technical safeguards should be used to reduce avoidable risk.
          </p>
        </div>
      </Panel>

      <Panel eyebrow="Choices" title="Your options">
        <div className="max-w-4xl space-y-5 text-base text-ink/72 leading-8">
          <p>
            You can control cookies through your browser settings and, where
            presented, through the site&apos;s consent message. Blocking some
            cookies may reduce functionality or affect whether ads can be served
            properly.
          </p>
          <p>
            If you are in a region with consent rights, you may be able to
            change your advertising and consent choices through the consent
            tools shown on the site.
          </p>
        </div>
      </Panel>
    </div>
  );
}

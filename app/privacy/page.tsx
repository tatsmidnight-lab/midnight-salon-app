export const metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-white/80">
      <h1 className="mb-8 text-3xl font-bold text-white">Privacy Policy</h1>
      <p className="mb-4 text-sm text-white/50">Last updated: 13 March 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">1. Information We Collect</h2>
          <p>We collect the following personal information when you use our services:</p>
          <ul className="ml-6 mt-2 list-disc space-y-1">
            <li>Phone number (for account creation and booking confirmations via SMS)</li>
            <li>Name and email (if provided)</li>
            <li>Booking history and service preferences</li>
            <li>Payment information (processed securely by Square — we do not store card details)</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">2. How We Use Your Information</h2>
          <ul className="ml-6 list-disc space-y-1">
            <li>To process and manage your bookings</li>
            <li>To send appointment reminders and confirmations via SMS (Twilio)</li>
            <li>To process payments securely (Square)</li>
            <li>To improve our services and website</li>
            <li>To communicate about promotions (only with your consent)</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">3. Data Storage</h2>
          <p>Your data is stored securely on Supabase (hosted in the EU). We use industry-standard encryption for data in transit (TLS) and at rest. Access to your data is restricted to authorised personnel only.</p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">4. Third-Party Services</h2>
          <p>We use the following third-party services that may process your data:</p>
          <ul className="ml-6 mt-2 list-disc space-y-1">
            <li><strong>Twilio</strong> — SMS delivery for OTP verification and booking notifications</li>
            <li><strong>Square</strong> — Payment processing</li>
            <li><strong>Supabase</strong> — Database hosting</li>
            <li><strong>Vercel</strong> — Website hosting</li>
          </ul>
          <p className="mt-2">Each provider has their own privacy policy and complies with applicable data protection regulations.</p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">5. Your Rights (GDPR)</h2>
          <p>If you are in the UK or EU, you have the right to:</p>
          <ul className="ml-6 mt-2 list-disc space-y-1">
            <li><strong>Access</strong> — Request a copy of your personal data</li>
            <li><strong>Rectification</strong> — Request correction of inaccurate data</li>
            <li><strong>Erasure</strong> — Request deletion of your data (&ldquo;right to be forgotten&rdquo;)</li>
            <li><strong>Portability</strong> — Request your data in a machine-readable format</li>
            <li><strong>Objection</strong> — Object to processing for marketing purposes</li>
          </ul>
          <p className="mt-2">To exercise any of these rights, contact us at <a href="mailto:hello@midnight.studio" className="text-purple-400 underline">hello@midnight.studio</a>. We will respond within 7 days.</p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">6. Cookies</h2>
          <p>We use a single essential cookie (<code className="rounded bg-white/10 px-1">salon_token</code>) for authentication. We do not use tracking cookies or third-party analytics cookies.</p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">7. Data Retention</h2>
          <p>We retain your personal data for as long as your account is active or as needed to provide services. Booking records are retained for 3 years for legal and accounting purposes. You can request deletion at any time.</p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">8. Security</h2>
          <p>We implement appropriate technical measures including encrypted connections (HTTPS), row-level security on our database, rate limiting on authentication endpoints, and secure cookie handling.</p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">9. Changes</h2>
          <p>We may update this policy from time to time. We will notify you of significant changes via SMS or email if we have your contact details.</p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">10. Contact</h2>
          <p>Data Controller: Midnight Studio, Glasgow, Scotland</p>
          <p>Email: <a href="mailto:hello@midnight.studio" className="text-purple-400 underline">hello@midnight.studio</a></p>
        </div>
      </section>
    </div>
  )
}

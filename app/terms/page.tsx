import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms & Conditions — Midnight Studio",
  description: "Terms and conditions for Midnight tattoo, piercing and eyelash studio in Glasgow. Read our policies on liability, aftercare, cancellations and more.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1
          className="text-4xl font-bold mb-2"
          style={{ color: "hsl(var(--text-primary))" }}
        >
          Terms & Conditions
        </h1>
        <p className="text-sm mb-10" style={{ color: "hsl(var(--text-muted))" }}>
          Last updated: March 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: "hsl(var(--text-secondary))" }}>
          {/* 1 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "hsl(var(--text-primary))" }}>
              1. General
            </h2>
            <p>
              These Terms and Conditions (&ldquo;Terms&rdquo;) apply to all services provided by Midnight Studio
              (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), a tattoo, piercing and eyelash studio
              operating in Glasgow, Scotland. By booking an appointment, purchasing products, or using our website,
              you agree to be bound by these Terms.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "hsl(var(--text-primary))" }}>
              2. Age Requirements
            </h2>
            <p>
              You must be at least 18 years of age for tattoo and piercing services. Proof of identification
              (passport, driving licence or national ID) is required at every appointment. We reserve the right
              to refuse service if satisfactory ID is not provided.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "hsl(var(--text-primary))" }}>
              3. Consent & Personal Responsibility
            </h2>
            <p className="mb-3">
              By proceeding with any tattoo, piercing or cosmetic procedure at Midnight Studio, you acknowledge
              and agree that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                The decision to receive a tattoo, piercing or eyelash treatment is entirely <strong>your own
                voluntary choice</strong>.
              </li>
              <li>
                You have been informed of the risks involved, including but not limited to: allergic reactions,
                infection, scarring, skin irritation, and dissatisfaction with the final result.
              </li>
              <li>
                You are <strong>solely responsible</strong> for following all aftercare instructions provided
                by our artists.
              </li>
              <li>
                You confirm that you are not under the influence of alcohol or drugs at the time of your appointment.
              </li>
              <li>
                You have disclosed any relevant medical conditions, allergies, skin conditions, or medications
                that may affect the procedure or healing process.
              </li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "hsl(var(--text-primary))" }}>
              4. Limitation of Liability
            </h2>
            <p className="mb-3">
              To the fullest extent permitted by law:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Midnight Studio shall <strong>not be held liable</strong> for any adverse reactions, infections,
                complications, or dissatisfaction arising from tattoo, piercing or eyelash services once the
                procedure has been completed.
              </li>
              <li>
                We are <strong>not responsible</strong> for the healing process, which depends on your individual
                health, aftercare adherence and lifestyle factors.
              </li>
              <li>
                Any issues resulting from failure to follow aftercare instructions, interference with the healing
                area, exposure to contaminants, or pre-existing medical conditions are <strong>your sole
                responsibility</strong>.
              </li>
              <li>
                Our total liability for any claim shall not exceed the amount you paid for the specific service
                giving rise to the claim.
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "hsl(var(--text-primary))" }}>
              5. Aftercare
            </h2>
            <p className="mb-3">
              Proper aftercare is essential for the best results and to minimise risk of complications.
              Detailed aftercare instructions will be provided after each procedure. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Follow all aftercare instructions provided by your artist</li>
              <li>Keep the treated area clean and protected as directed</li>
              <li>Avoid swimming, saunas, direct sunlight and abrasive products during the healing period</li>
              <li>Contact us or seek medical advice promptly if you experience signs of infection or adverse reaction</li>
              <li>Attend any recommended follow-up appointments</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "hsl(var(--text-primary))" }}>
              6. Bookings & Cancellations
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>A non-refundable deposit may be required to secure your booking.</li>
              <li>
                Cancellations must be made at least <strong>48 hours</strong> before your appointment.
                Late cancellations or no-shows may result in loss of deposit.
              </li>
              <li>We reserve the right to cancel or reschedule appointments at our discretion, in which case any deposit will be fully refunded.</li>
              <li>Arriving more than 15 minutes late may result in your appointment being rescheduled.</li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "hsl(var(--text-primary))" }}>
              7. Pricing & Payment
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All prices listed are in GBP and are indicative. Final pricing may vary based on the complexity, size and duration of the work.</li>
              <li>Payment is due upon completion of the service unless otherwise agreed.</li>
              <li>We accept cash, card payments and online payments through our booking system.</li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "hsl(var(--text-primary))" }}>
              8. Products & Refunds
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Products purchased through our shop are non-refundable unless faulty or not as described, in accordance with the Consumer Rights Act 2015.</li>
              <li>Aftercare products should be used as directed. We accept no liability for misuse.</li>
              <li>Gift cards are non-refundable, non-transferable and cannot be exchanged for cash.</li>
            </ul>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "hsl(var(--text-primary))" }}>
              9. Health & Safety
            </h2>
            <p>
              We comply with all relevant UK health and safety regulations, including local authority licensing
              requirements for tattooing and piercing in Scotland. All equipment is either single-use disposable
              or sterilised in accordance with industry standards. Our premises are regularly inspected and
              maintained to the highest hygiene standards.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "hsl(var(--text-primary))" }}>
              10. Intellectual Property
            </h2>
            <p>
              All custom designs created by our artists remain the intellectual property of Midnight Studio
              unless otherwise agreed in writing. Designs may be used in our portfolio, social media and
              marketing materials unless you request otherwise.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "hsl(var(--text-primary))" }}>
              11. Privacy & Data Protection
            </h2>
            <p>
              We collect and process personal data in accordance with the UK General Data Protection Regulation
              (UK GDPR) and the Data Protection Act 2018. Your personal information is used solely for the
              purpose of providing our services, processing bookings, and communicating with you. We do not sell
              or share your data with third parties except where necessary to provide our services (e.g. payment
              processing, SMS notifications).
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "hsl(var(--text-primary))" }}>
              12. Dispute Resolution
            </h2>
            <p>
              Any disputes arising from these Terms shall be governed by the laws of Scotland. We encourage you
              to contact us directly to resolve any issues. If a resolution cannot be reached, disputes may be
              referred to the appropriate Scottish courts.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "hsl(var(--text-primary))" }}>
              13. Changes to These Terms
            </h2>
            <p>
              We reserve the right to update these Terms at any time. Changes will be posted on this page.
              Continued use of our services following any changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          {/* Contact */}
          <section className="card-glass p-6 mt-12">
            <h2 className="text-lg font-bold mb-3" style={{ color: "hsl(var(--text-primary))" }}>
              Contact Us
            </h2>
            <p>
              If you have any questions about these Terms & Conditions, please contact us:
            </p>
            <ul className="mt-3 space-y-1">
              <li>Phone: <a href="tel:+447958747929" className="underline" style={{ color: "var(--accent-hex)" }}>07958 747929</a></li>
              <li>Instagram: <a href="https://www.instagram.com/midnight.tats/" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--accent-hex)" }}>@midnight.tats</a></li>
              <li>Location: Glasgow, Scotland</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

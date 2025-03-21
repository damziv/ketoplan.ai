export default function PrivacyPolicy() {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-3xl text-left">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 text-center">Privacy Policy</h1>
          <p className="text-gray-600 mb-4 text-sm text-center">Last updated: {new Date().toLocaleDateString()}</p>
  
          <p className="text-gray-700 mb-4">
            Welcome to AImealPrep. Your privacy is important to us. This **Privacy Policy** explains how we collect, process, and protect your personal data in accordance with the **General Data Protection Regulation (GDPR) (EU) 2016/679** and other applicable data protection laws.
          </p>
  
          {/* ✅ 1. Data Controller */}
          <h2 className="text-xl font-semibold text-gray-900 mt-6">1. Data Controller</h2>
          <p className="text-gray-700 mt-2">
            The **Data Controller** responsible for processing your personal data under this policy is:
          </p>
          <p className="text-gray-900 font-bold mt-2">AImealPrep</p>
          <p className="text-gray-900">📍 Address: [Your Company Address]</p>
          <p className="text-gray-900">📩 Email: support@aimealprep.com</p>
  
          {/* ✅ 2. What Personal Data We Collect */}
          <h2 className="text-xl font-semibold text-gray-900 mt-6">2. What Personal Data We Collect</h2>
          <p className="text-gray-700 mt-2">We collect and process the following data:</p>
          <ul className="list-disc ml-6 text-gray-700 mt-2">
            <li>**Email address** – Required for account creation and meal plan delivery.</li>
            <li>**Dietary preferences & quiz responses** – To generate personalized meal plans.</li>
            <li>**Payment details** – Processed securely by **Stripe** (we do **not** store card details).</li>
            <li>**Technical data** – IP address, browser type, and device info (for security and analytics).</li>
            <li>**User activity data** – Interactions with our platform to improve services.</li>
          </ul>
  
          {/* ✅ 3. Legal Basis for Data Processing */}
          <h2 className="text-xl font-semibold text-gray-900 mt-6">3. Legal Basis for Data Processing</h2>
          <p className="text-gray-700 mt-2">
            We process your personal data in compliance with **Article 6 of the GDPR**:
          </p>
          <ul className="list-disc ml-6 text-gray-700 mt-2">
            <li>📌 **Consent** – When you provide personal data for meal planning.</li>
            <li>📌 **Contractual necessity** – To deliver requested services.</li>
            <li>📌 **Legitimate interest** – For fraud prevention, analytics, and app improvements.</li>
            <li>📌 **Legal obligations** – Compliance with tax, legal, and regulatory requirements.</li>
          </ul>
  
          {/* ✅ 4. How We Use Your Data */}
          <h2 className="text-xl font-semibold text-gray-900 mt-6">4. How We Use Your Data</h2>
          <p className="text-gray-700 mt-2">We use your data for the following purposes:</p>
          <ul className="list-disc ml-6 text-gray-700 mt-2">
            <li>📩 Deliver personalized meal plans via email.</li>
            <li>🔒 Process and verify payments (via **Stripe**).</li>
            <li>📊 Improve user experience through analytics.</li>
            <li>🛡️ Maintain app security and fraud prevention.</li>
          </ul>
  
          {/* ✅ 5. Data Retention */}
          <h2 className="text-xl font-semibold text-gray-900 mt-6">5. Data Retention</h2>
          <p className="text-gray-700 mt-2">
            We retain your personal data **only for as long as necessary** to fulfill the purpose of collection or as required by law.
          </p>
          <p className="text-gray-700 mt-2">
            - Payment records are retained for tax & compliance purposes.  
            - Email and meal plan data are retained until you request deletion.  
          </p>
  
          {/* ✅ 6. Data Security */}
          <h2 className="text-xl font-semibold text-gray-900 mt-6">6. Data Security</h2>
          <p className="text-gray-700 mt-2">
            We implement industry-standard security measures to protect your data:
          </p>
          <ul className="list-disc ml-6 text-gray-700 mt-2">
            <li>🔒 **Encryption** – All stored data is encrypted.</li>
            <li>🔐 **Secure Payments** – Handled by **Stripe**.</li>
            <li>🛡️ **Access Control** – Only authorized personnel can access personal data.</li>
          </ul>
  
          {/* ✅ 7. Third-Party Data Sharing */}
          <h2 className="text-xl font-semibold text-gray-900 mt-6">7. Third-Party Data Sharing</h2>
          <p className="text-gray-700 mt-2">
            We only share data with trusted third-party providers **when necessary** for service functionality:
          </p>
          <ul className="list-disc ml-6 text-gray-700 mt-2">
            <li>**Stripe** – Payment processing.</li>
            <li>**Supabase** – Secure database storage.</li>
            <li>**OpenAI** – Meal plan generation.</li>
            <li>**SendGrid** – Email delivery service.</li>
          </ul>
  
          {/* ✅ 8. Your Rights Under GDPR */}
          <h2 className="text-xl font-semibold text-gray-900 mt-6">8. Your Rights Under GDPR</h2>
          <p className="text-gray-700 mt-2">As an EU resident, you have the right to:</p>
          <ul className="list-disc ml-6 text-gray-700 mt-2">
            <li>📥 **Access** your personal data.</li>
            <li>✏️ **Correct** inaccurate data.</li>
            <li>🗑️ **Request deletion** ("Right to be forgotten").</li>
            <li>🔄 **Data portability** (receive your data in a structured format).</li>
            <li>🚫 **Object** to certain data processing.</li>
          </ul>
  
          {/* ✅ 9. How to Contact Us */}
          <h2 className="text-xl font-semibold text-gray-900 mt-6">9. How to Contact Us</h2>
          <p className="text-gray-700 mt-2">
            To exercise your rights or for privacy concerns, please contact us:
          </p>
          <p className="text-gray-900 font-bold mt-2">📩 Email: support@aimealprep.com</p>
          <p className="text-gray-900 font-bold">📍 Address: [Your Company Address]</p>
  
          {/* ✅ Back Button */}
          <button
            className="mt-6 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
            onClick={() => window.history.back()}
          >
            Back
          </button>
        </div>
      </div>
    );
  }
  
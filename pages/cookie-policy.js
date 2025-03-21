import Link from "next/link";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-3xl text-left">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">🍪 Cookie Policy</h1>

        <p className="text-gray-700 mb-4">
          Last updated: <strong>March 2025</strong>
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6">1. Introduction</h2>
        <p className="text-gray-700">
          AImealPrep ("we", "our", "us") uses cookies to enhance your experience, analyze site traffic, and improve our services. 
          This policy explains how we use cookies and how you can manage your preferences.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6">2. What Are Cookies?</h2>
        <p className="text-gray-700">
          Cookies are small text files stored on your device when you visit a website. They help us remember user preferences, 
          improve functionality, and analyze site performance.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6">3. Types of Cookies We Use</h2>

        <h3 className="text-lg font-semibold text-gray-900 mt-4">Essential Cookies</h3>
        <p className="text-gray-700">
          These cookies are necessary for the website to function properly. You **cannot disable** them as they provide essential features.
        </p>

        <h3 className="text-lg font-semibold text-gray-900 mt-4">Analytics Cookies</h3>
        <p className="text-gray-700">
          These cookies help us understand how users interact with the site (e.g., Google Analytics). 
          They allow us to improve content and navigation.
        </p>

        <h3 className="text-lg font-semibold text-gray-900 mt-4">Marketing Cookies</h3>
        <p className="text-gray-700">
          Used for targeted advertising and personalized content. We ask for your **explicit consent** before using these cookies.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6">4. How to Manage Cookies</h2>
        <p className="text-gray-700">
          You can manage or disable cookies in your browser settings:
        </p>
        <ul className="list-disc pl-5 text-gray-700">
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Mozilla Firefox</a></li>
          <li><a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Safari</a></li>
          <li><a href="https://support.microsoft.com/en-us/help/17442/windows-internet-explorer-delete-manage-cookies" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Internet Explorer/Edge</a></li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-800 mt-6">5. Third-Party Cookies</h2>
        <p className="text-gray-700">
          We may use third-party cookies from services such as **Google Analytics** and **Stripe** for analytics and payments.
          These services have their own cookie policies.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6">6. Your Consent</h2>
        <p className="text-gray-700">
          By using our website, you agree to the use of cookies as described in this policy. 
          You can withdraw consent at any time by adjusting your browser settings.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6">7. Changes to This Policy</h2>
        <p className="text-gray-700">
          We may update this Cookie Policy from time to time. The latest version will always be available on this page.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6">8. Contact Us</h2>
        <p className="text-gray-700">
          If you have questions about this policy, contact us at:
          <a href="mailto:support@ai-mealprep.com" className="text-blue-600 hover:underline"> support@ai-mealprep.com</a>.
        </p>

        {/* Back to Home Button */}
        <div className="text-center mt-6">
          <Link href="/" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

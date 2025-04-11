"use client";
import React, { useState, useEffect } from 'react';
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import SlugFooter from "@/app/components/SlugFooter";  // Correct relative import
import { FloatingNav } from "@/app/components/ui/floating-navbar";
import MainFooter from '@/app/components/MainFooter';
import LegalSidebar from '../LegalSidebar';
const PrivacyNotice = () => {
    const navItems = [
        {
            name: "Home",
            link: "/",
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            ,
        },
        // {
        //     name: "Contact",
        //     link: "/about",
        //     icon: <p className="h-4 w-4 text-neutral-500 dark:text-white">TEST</p>,
        // }
    ];

    const markdownContent = `
# SchoolNest Privacy Policy

**Last updated January 27, 2025**

This Privacy Notice for SchoolNest ("we," "us," or "our"), describes how and why we might access, collect, store, use, and/or share ("process") your personal information when you use our services ("Services"), including when you:

- Visit our website at [https://schoolnest.org](https://schoolnest.org), or any website of ours that links to this Privacy Notice
- Use SchoolNest. A collaborative, all-in-one education platform that provides information on events, announcements, clubs and school schedules, efficiently connecting students and schools.
- Engage with us in other related ways, including any sales, marketing, or events

**Questions or concerns?** Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at [schoolnestcontact@gmail.com](mailto:schoolnestcontact@gmail.com).

## SUMMARY OF KEY POINTS

**_This summary provides key points from our Privacy Notice._**

**What personal information do we process?** When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.

**Do we process any sensitive personal information?** Some of the information may be considered "special" or "sensitive" in certain jurisdictions, for example your racial or ethnic origins, sexual orientation, and religious beliefs. We may process sensitive personal information when necessary with your consent or as otherwise permitted by applicable law.

**Do we collect any information from third parties?** We do not collect any information from third parties.

**How do we process your information?** We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We process your information only when we have a valid legal reason to do so.

**In what situations and with which parties do we share personal information?** We may share information in specific situations and with specific third parties.

**How do we keep your information safe?** We have adequate organizational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information.

**What are your rights?** Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.

**How do you exercise your rights?** The easiest way to exercise your rights is by submitting a data subject access request, or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.

## 1. WHAT INFORMATION DO WE COLLECT?

### Personal information you disclose to us

**_In Short:_** We collect personal information that you provide to us.

We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.

**Personal Information Provided by You.** The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:

- Names
- Contact or authentication data
- Usernames
- Passwords
- Email addresses

**Sensitive Information.** When necessary, with your consent or as otherwise permitted by applicable law, we process the following categories of sensitive information:

- Student data

All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.

### Information automatically collected

**_In Short:_** Some information — such as your Internet Protocol (IP) address and/or browser and device characteristics — is collected automatically when you visit our Services.

We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Services, and other technical information. This information is primarily needed to maintain the security and operation of our Services, and for our internal analytics and reporting purposes.

Like many businesses, we also collect information through cookies and similar technologies.

The information we collect includes:

- **Log and Usage Data.** Log and usage data is service-related, diagnostic, usage, and performance information our servers automatically collect when you access or use our Services and which we record in log files. Depending on how you interact with us, this log data may include your IP address, device information, browser type, and settings and information about your activity in the Services (such as the date/time stamps associated with your usage, pages and files viewed, searches, and other actions you take such as which features you use), device event information (such as system activity, error reports (sometimes called "crash dumps"), and hardware settings.

## Google API

Our use of information received from Google APIs will adhere to [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the [Limited Use requirements](https://developers.google.com/terms/api-services-user-data-policy#limited-use).

## 2. HOW DO WE PROCESS YOUR INFORMATION?

**_In Short:_** We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.

**We process your personal information for a variety of reasons, depending on how you interact with our Services, including:**

- **To facilitate account creation and authentication and otherwise manage user accounts.** We may process your information so you can create and log in to your account, as well as keep your account in working order.
- **To deliver and facilitate delivery of services to the user.** We may process your information to provide you with the requested service.
- **To evaluate and improve our Services, products, marketing, and your experience.** We may process your information when we believe it is necessary to identify usage trends, determine the effectiveness of our promotional campaigns, and to evaluate and improve our Services, products, marketing, and your experience.
- **To comply with our legal obligations.** We may process your information to comply with our legal obligations, respond to legal requests, and exercise, establish, or defend our legal rights.

## 3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?

**_In Short:_** We may share information in specific situations described in this section and/or with the following third parties.

We may need to share your personal information in the following situations:

- **Business Transfers.** We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.

## 4. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?

**_In Short:_** We may use cookies and other tracking technologies to collect and store your information.

We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. Some online tracking technologies help us maintain the security of our Services and your account, prevent crashes, fix bugs, save your preferences, and assist with basic site functions.

We also permit third parties and service providers to use online tracking technologies on our Services for analytics and advertising, including to help manage and display advertisements, to tailor advertisements to your interests, or to send abandoned shopping cart reminders (depending on your communication preferences). The third parties and service providers use their technology to provide advertising about products and services tailored to your interests which may appear either on our Services or on other websites.

To the extent these online tracking technologies are deemed to be a "sale"/"sharing" (which includes targeted advertising, as defined under the applicable laws) under applicable US state laws, you can opt out of these online tracking technologies by submitting a request as described below under section "DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?"

Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice.

## Google Analytics

We may share your information with Google Analytics to track and analyze the use of the Services. To opt out of being tracked by Google Analytics across the Services, visit [https://tools.google.com/dlpage/gaoptout](https://tools.google.com/dlpage/gaoptout). For more information on the privacy practices of Google, please visit the [Google Privacy & Terms page](https://policies.google.com/privacy).

## 5. HOW LONG DO WE KEEP YOUR INFORMATION?

**_In Short:_** We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.

We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.

When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.

## 6. HOW DO WE KEEP YOUR INFORMATION SAFE?

**_In Short:_** We aim to protect your personal information through a system of organizational and technical security measures.

We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.

## 7. WHAT ARE YOUR PRIVACY RIGHTS?

**_In Short:_** You may review, change, or terminate your account at any time, depending on your country, province, or state of residence.

**Withdrawing your consent:** If we are relying on your consent to process your personal information, which may be express and/or implied consent depending on the applicable law, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us by using the contact details provided in the section "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?" below.

However, please note that this will not affect the lawfulness of the processing before its withdrawal nor, when applicable law allows, will it affect the processing of your personal information conducted in reliance on lawful processing grounds other than consent.

### Account Information

If you would at any time like to review or change the information in your account or terminate your account, you can:

- Log in to your account settings and update your user account.
- Contact us using the contact information provided.

Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.

**Cookies and similar technologies:** Most Web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove cookies and to reject cookies. If you choose to remove cookies or reject cookies, this could affect certain features or services of our Services.

If you have questions or comments about your privacy rights, you may email us at [schoolnestcontact@gmail.com](mailto:schoolnestcontact@gmail.com).

## 8. CONTROLS FOR DO-NOT-TRACK FEATURES

Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Notice.

California law requires us to let you know how we respond to web browser DNT signals. Because there currently is not an industry or legal standard for recognizing or honoring DNT signals, we do not respond to them at this time.

## 9. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?

**_In Short:_** If you are a resident of California, Colorado, Connecticut, Delaware, Florida, Indiana, Iowa, Kentucky, Minnesota, Montana, Nebraska, New Hampshire, New Jersey, Oregon, Tennessee, Texas, Utah, or Virginia, you may have the right to request access to and receive details about the personal information we maintain about you and how we have processed it, correct inaccuracies, get a copy of, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. More information is provided below.

### Categories of Personal Information We Collect

We have collected the following categories of personal information in the past twelve (12) months:

| Category | Examples | Collected |
| --- | --- | --- |
| A. Identifiers | Contact details, such as real name, alias, postal address, telephone or mobile contact number, unique personal identifier, online identifier, Internet Protocol address, email address, and account name | YES |
| B. Personal information as defined in the California Customer Records statute | Name, contact information, education, employment, employment history, and financial information | YES |
| C. Protected classification characteristics under state or federal law | Gender, age, date of birth, race and ethnicity, national origin, marital status, and other demographic data | YES |
| D. Commercial information | Transaction information, purchase history, financial details, and payment information | NO |
| E. Biometric information | Fingerprints and voiceprints | NO |
| F. Internet or other similar network activity | Browsing history, search history, online behavior, interest data, and interactions with our and other websites, applications, systems, and advertisements | NO |
| G. Geolocation data | Device location | NO |
| H. Audio, electronic, sensory, or similar information | Images and audio, video or call recordings created in connection with our business activities | NO |
| I. Professional or employment-related information | Business contact details in order to provide you our Services at a business level or job title, work history, and professional qualifications if you apply for a job with us | NO |
| J. Education Information | Student records and directory information | YES |
| K. Inferences drawn from collected personal information | Inferences drawn from any of the collected personal information listed above to create a profile or summary about, for example, an individual’s preferences and characteristics | NO |
| L. Sensitive personal Information | | NO |

We may also collect other personal information outside of these categories through instances where you interact with us in person, online, or by phone or mail in the context of:

- Receiving help through our customer support channels;
- Participation in customer surveys or contests; and
- Facilitation in the delivery of our Services and to respond to your inquiries.

We will use and retain the collected personal information as needed to provide the Services or for:

- **Category A** - As long as the user has an account with us
- **Category B** - As long as the user has an account with us
- **Category C** - As long as the user has an account with us
- **Category H** - As long as the user has an account with us
- **Category J** - As long as the user has an account with us

### Sources of Personal Information

Learn more about the sources of personal information we collect in "WHAT INFORMATION DO WE COLLECT?"

### How We Use and Share Personal Information

Learn more about how we use your personal information in the section, "HOW DO WE PROCESS YOUR INFORMATION?"

**Will your information be shared with anyone else?**

We may disclose your personal information with our service providers pursuant to a written contract between us and each service provider. Learn more about how we disclose personal information to in the section, "WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?"

We may use your personal information for our own business purposes, such as for undertaking internal research for technological development and demonstration. This is not considered to be "selling" of your personal information.

We have not disclosed, sold, or shared any personal information to third parties for a business or commercial purpose in the preceding twelve (12) months. We will not sell or share personal information in the future belonging to website visitors, users, and other consumers.

### Your Rights

You have rights under certain US state data protection laws. However, these rights are not absolute, and in certain cases, we may decline your request as permitted by law. These rights include:

- **Right to know whether or not we are processing your personal data**
- **Right to access your personal data**
- **Right to correct inaccuracies in your personal data**
- **Right to request the deletion of your personal data**
- **Right to obtain a copy of the personal data you previously shared with us**
- **Right to non-discrimination for exercising your rights**
- **Right to opt out of the processing of your personal data if it is used for targeted advertising (or sharing as defined under California’s privacy law), the sale of personal data, or profiling in furtherance of decisions that produce legal or similarly significant effects ("profiling")**

Depending upon the state where you live, you may also have the following rights:

- **Right to access the categories of personal data being processed (as permitted by applicable law, including Minnesota’s privacy law)**
- **Right to obtain a list of the categories of third parties to which we have disclosed personal data (as permitted by applicable law, including California’s and Delaware’s privacy law)**
- **Right to obtain a list of specific third parties to which we have disclosed personal data (as permitted by applicable law, including Minnesota’s and Oregon’s privacy law)**
- **Right to review, understand, question, and correct how personal data has been profiled (as permitted by applicable law, including Minnesota’s privacy law)**
- **Right to limit use and disclosure of sensitive personal data (as permitted by applicable law, including California’s privacy law)**
- **Right to opt out of the collection of sensitive data and personal data collected through the operation of a voice or facial recognition feature (as permitted by applicable law, including Florida’s privacy law)**

### How to Exercise Your Rights

To exercise these rights, you can contact us by submitting a data subject access request, by emailing us at [schoolnestcontact@gmail.com](mailto:schoolnestcontact@gmail.com), or by referring to the contact details at the bottom of this document.

Under certain US state data protection laws, you can designate an authorized agent to make a request on your behalf. We may deny a request from an authorized agent that does not submit proof that they have been validly authorized to act on your behalf in accordance with applicable laws.

### Request Verification

Upon receiving your request, we will need to verify your identity to determine you are the same person about whom we have the information in our system. We will only use personal information provided in your request to verify your identity or authority to make the request. However, if we cannot verify your identity from the information already maintained by us, we may request that you provide additional information for the purposes of verifying your identity and for security or fraud-prevention purposes.

If you submit the request through an authorized agent, we may need to collect additional information to verify your identity before processing your request and the agent will need to provide a written and signed permission from you to submit such request on your behalf.

### Appeals

Under certain US state data protection laws, if we decline to take action regarding your request, you may appeal our decision by emailing us at [schoolnestcontact@gmail.com](mailto:schoolnestcontact@gmail.com). We will inform you in writing of any action taken or not taken in response to the appeal, including a written explanation of the reasons for the decisions. If your appeal is denied, you may submit a complaint to your state attorney general.

### California "Shine The Light" Law

California Civil Code Section 1798.83, also known as the "Shine The Light" law, permits our users who are California residents to request and obtain from us, once a year and free of charge, information about categories of personal information (if any) we disclosed to third parties for direct marketing purposes and the names and addresses of all third parties with which we shared personal information in the immediately preceding calendar year. If you are a California resident and would like to make such a request, please submit your request in writing to us by using the contact details provided in the section "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?"

## 10. DO WE MAKE UPDATES TO THIS NOTICE?

**_In Short:_** Yes, we will update this notice as necessary to stay compliant with relevant laws.

We may update this Privacy Notice from time to time. The updated version will be indicated by an updated "Revised" date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.

## 11. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?

If you have questions or comments about this notice, you may email us at [schoolnestcontact@gmail.com](mailto:schoolnestcontact@gmail.com) or contact us by post at:

SchoolNest  
_____, MD  
United States

## 12. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?

Based on the applicable laws of your country or state of residence in the US, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please fill out and submit a data subject access request.
`;

    return (
        <>
            <div className="flex min-h-screen bg-white text-black p-6 dark:bg-black dark:text-white">
                {/* Sidebar Menu */}
                <FloatingNav />
                <LegalSidebar />

                {/* Main Content */}
                <div className="w-3/4 p-8 rounded-2xl border-2 border-gray-300 bg-opacity-70 ml-6 dark:border-gray-700 dark:bg-opacity-70">
                    <br></br>
                    <br></br>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        className="prose dark:prose-invert"
                        components={{
                            h1: ({ node, ...props }) => (
                                <h1 className="text-4xl font-bold my-4" {...props} />
                            ),
                            h2: ({ node, ...props }) => (
                                <h2 className="text-3xl font-semibold my-3" {...props} />
                            ),
                            h3: ({ node, ...props }) => (
                                <h2 className="text-2xl font-semibold my-3" {...props} />
                            ),
                            a: ({ node, ...props }) => (
                                <a className="text-blue-500 hover:underline dark:text-blue-300" {...props} />
                            ),
                            table: ({ node, ...props }) => (
                                <table
                                    className="table-auto border-collapse border border-gray-300 dark:border-gray-700 w-full my-4 bg-white text-black dark:bg-black dark:text-white"
                                    {...props}
                                />
                            ),
                            thead: ({ node, ...props }) => (
                                <thead className="bg-white text-black dark:bg-black dark:text-white" {...props} />
                            ),
                            th: ({ node, ...props }) => (
                                <th className="px-4 py-2 border border-gray-300 dark:border-gray-700" {...props} />
                            ),
                            tr: ({ node, ...props }) => (
                                <tr className="border border-gray-300 dark:border-gray-700" {...props} />
                            ),
                            td: ({ node, ...props }) => (
                                <td className="px-4 py-2 border border-gray-300 dark:border-gray-700" {...props} />
                            ),
                            ol: ({ node, ...props }) => (
                                <ol style={{ listStyleType: "lower-alpha" }} className="pl-6 my-2" {...props} />
                            ),
                            ul: ({ node, ...props }) => (
                                <ul className="list-disc pl-6 my-2" {...props} />
                            ),
                            li: ({ node, ...props }) => (
                                <li className="my-2" {...props} />
                            ),
                            p: ({ node, ...props }) => (
                                <p className="my-4" {...props} />
                            ),
                        }}
                    >
                        {markdownContent}
                    </ReactMarkdown>
                </div>

            </div>
            <MainFooter />
        </>
    )
}
export default PrivacyNotice;
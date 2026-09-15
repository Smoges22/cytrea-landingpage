"use strict";
// Editorial copy maps to genuine, unaltered source screenshots. No live statistics.
const screen = (file, alt, caption = "Actual Cytrea screen · Select to enlarge") => ({ file, alt, caption });
const screens = {
  provider: screen("provider/provider-review-applicants", "Cytrea provider dashboard with hiring activity"),
  providerSetup: screen("provider/provider-onbording", "Create your provider profile in Cytrea"),
  jobs: screen("provider/provider-jobs", "Cytrea provider job board and Create New Job action"),
  applicants: screen("provider/provider-checks-applicants", "Provider applicant review with View Profile and Message actions"),
  information: screen("provider/provider-applicant-review", "Available caregiver cards with profile and message actions"),
  workflow: screen("provider/provider-dashboard", "Provider hiring overview with open jobs and application activity"),
  caregiver: screen("caregiver/caregiver-dashboard", "Cytrea caregiver dashboard"),
  profile: screen("caregiver/caregiver-create-account", "Create your caregiver profile in Cytrea"),
  preferences: screen("caregiver/caregiver-builing-profile", "Caregiver work preferences and profile setup"),
  credentials: screen("caregiver/caregiver-credentials-upload", "Caregiver credential upload categories"),
  search: screen("caregiver/caregiver-job-search", "Browse Adult Family Home jobs in Cytrea"),
  apply: screen("caregiver/caregiver-submit-application", "Application submitted confirmation in Cytrea"),
  applications: screen("caregiver/caregiver-application-status", "Caregiver application status and provider response"),
  messaging: screen("caregiver/live-messaging", "A caregiver and provider conversation in Cytrea", "Conversation example · Caregiver-side view")
};
const chapters = [
  { id: "provider-workspace", label: "Provider workspace", title: "A home for your hiring day.", copy: "Open roles, applicants, and hiring activity come together in the provider workspace.", screen: "provider", companion: "jobs", tone: "cool" },
  { id: "caregiver-experience", label: "Caregiver experience", title: "Your next step, within reach.", copy: "Keep your profile, applications, and conversations close as you look for your next role.", screen: "caregiver", tone: "warm" },
  { id: "finding-jobs", label: "Finding jobs", title: "Find a role that fits your day.", copy: "Browse AFH openings with location, schedule, and pay details before you apply.", screen: "search", tone: "white" },
  { id: "applicant-review", label: "Applicant review", title: "See the person behind the application.", copy: "Review applicant cards, open a caregiver profile, or start a conversation from the same place.", screen: "applicants", companion: "information", tone: "cool" },
  { id: "credentials", label: "Credentials", title: "Experience, with the details alongside.", copy: "Caregivers can organize supporting credentials; providers remain responsible for verification.", screen: "credentials", tone: "warm" },
  { id: "applications", label: "Applications", title: "Know where you stand.", copy: "Follow application progress and provider responses without losing track of your next step.", screen: "applications", companion: "apply", tone: "white" },
  { id: "messaging", label: "Messaging", title: "Keep the conversation human.", copy: "Caregivers and providers can discuss the role and the next step directly in Cytrea.", screen: "messaging", tone: "cool" }
];
const journeys = {
  caregiver: [
    ["Create your profile", "Start with your account details, then follow the guided caregiver profile setup.", "profile"],
    ["Add your preferences", "Share the work preferences and experience that help describe the role you are looking for.", "preferences"],
    ["Add your credentials", "Upload and organize the supporting credentials you want to share.", "credentials"],
    ["Browse AFH jobs", "Explore Adult Family Home openings and compare the details that matter to you.", "search"],
    ["Apply to a role", "Send your application to a chosen role and see confirmation that it was submitted.", "apply"],
    ["Track your application", "Check application status and see when a provider responds.", "applications"],
    ["Connect with a provider", "Use the conversation to discuss the opportunity and your next step.", "messaging"]
  ],
  provider: [
    ["Create your provider profile", "Add your business details, then continue to facility setup in the guided flow.", "providerSetup"],
    ["Post a job", "Start a new opening from your job board and share the role details caregivers need.", "jobs"],
    ["Review applicants", "See the caregivers who applied to your opening and review their applicant cards.", "applicants"],
    ["View caregiver information", "Open View Profile from a caregiver card to learn more before moving forward.", "information"],
    ["Message a caregiver", "Start a conversation to discuss the role; this example shows the caregiver side of the chat.", "messaging"],
    ["Manage your hiring workflow", "Return to your dashboard to keep open roles and application activity in view.", "workflow"]
  ]
};
module.exports = { screens, chapters, journeys };

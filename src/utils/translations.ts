// Define the type first, before the translations object
export type TranslationKey = 
  // Common
  | "name" | "email" | "password" | "language" | "phoneNumber" | "noPhoneNumber"
  | "error" | "success" | "cancel" | "save" | "edit" | "create" | "delete"
  | "continue" | "yes" | "no" | "add" | "admin" | "login" | "register"
  | "clientDetails" | "previous" | "next" | "creatingAccount" | "alreadyHaveAccount"
  | "beforeWeContinue" | "enterPassword" | "loggingIn" | "noAccount" | "signUp"
  | "loading" | "search" | "filter" | "all" | "completed" | "inProgress" | "failed"
  | "loginSuccess" | "loginFailed" | "welcomeBack" | "enterEmail" | "qaUpdateSuccess"
  | "confirmDeleteTitle" | "questionKey" | "answer" | "addNewQA"
  | "welcomeEditor" | "editorQADescription" | "timeFormat"
  | "passwordTooShort" | "passwordUpdated" | "errorResettingPassword" | "resetPassword" | "newPassword" | "updatePassword"
  | "propertyInformation" | "servicesAndAmenities" | "poolAndSpa" | "facilities"
  | "additionalServices" | "businessAndAccess" | "contactInformation" | "customQuestions"
  | "userHangup" | "assistantHangup" | "callOutcomes" | "conversations" | "recentTranscripts"
  | "playRecording" | "pauseRecording" | "stopRecording" | "saving" | "errorFetchingData" | "errorUpdatingQA"
  | "deleteSelected" | "usersDeleted" | "errorDeletingUsers" | "confirmDeleteDescription" | "confirmBulkDeleteDescription"
  
  // Dashboard & Stats
  | "dashboard" | "totalCalls" | "incomingCalls" | "openTickets" | "unassignedTickets"
  | "resolvedTickets" | "callVolume" | "callVolumeDescription" | "recentTickets"
  | "ticketStatusDescription" | "noResults" | "searchTickets" | "duration" | "cost"
  | "status" | "summary" | "created" | "time" | "callsFound" | "allStatus"
  | "calls" | "messages" | "avgDuration" | "successRate"
  
  // Admin & Management
  | "adminPanel" | "settings" | "users" | "assistants" | "role" | "logout"
  | "editorPanel" | "phoneNumbers" | "enterNewPhoneNumber" | "phoneNumberManagement"
  | "user" | "editor" | "profile" | "lightMode" | "darkMode" | "manageUsersAndPermissions"
  | "owner" | "permissions" | "actions" | "confirmDelete" | "deleteConfirmation"
  | "temperature" | "maxTokens" | "selectRole" | "selectAssistants" | "selectLanguage"
  | "errorFetchingAssistants"
  
  // User Management
  | "userManagement" | "createUser" | "createNewUser" | "createUserDescription"
  | "editUser" | "editUserDescription" | "userCreated" | "userCreatedDescription"
  | "userUpdated" | "userUpdatedDescription" | "userDeleted" | "userDeletedDescription"
  | "errorCreatingUser" | "errorUpdatingUser" | "errorDeletingUser" | "assignedAssistants"
  | "single" | "assistantAccess" | "selectAssistant" | "assignedPhoneNumbers"
  
  // Assistant Management
  | "assistantManagement" | "createAssistant" | "createNewAssistant" | "createAssistantDescription"
  | "editAssistant" | "editAssistantDescription" | "assistantCreated" | "assistantCreatedDescription"
  | "assistantUpdated" | "assistantUpdatedDescription" | "assistantDeleted" | "assistantDeletedDescription"
  | "errorCreatingAssistant" | "errorUpdatingAssistant" | "errorDeletingAssistant"
  | "model" | "systemPrompt" | "voiceId" | "initialMessage"
  | "assistant.noVoiceSelected" | "assistant.noInitialMessage"
  
  // Hotel Questions
  | "propertyName" | "location" | "hotelQuestions" | "breakfastService" | "lunchService"
  | "dinnerService" | "poolHours" | "spaServices" | "checkoutProcedures" | "ironingFacilities"
  | "iceMachineLocation" | "kidsClubServices" | "synagogueServices" | "gymFacilities"
  | "businessLounge" | "accessibilityFeatures" | "uniqueAmenities" | "contactPerson"
  | "contactEmail" | "contactPhone"
  
  // Transcript Viewer
  | "errorPlayingRecording" | "recentTranscripts" | "noTranscriptsAvailable" 
  | "noConversationsFound" | "backToConversations" | "playRecording"
  | "transcript" | "conversation" | "speaker" | "timestamp" | "content"
  
  // Command Palette
  | "searchCommands" | "noCommandsFound" | "shortcuts" | "navigation" | "theme"
  | "preferences" | "account" | "help" | "documentation" | "support"
  | "quickActions" | "recentItems" | "favorites" | "pressKeyToSearch"
  | "loginDescription"
  | "selectAssistantAccess";

export const translations = {
  en: {
    // Common
    name: "Name",
    email: "Email",
    password: "Password",
    language: "Language",
    phoneNumber: "Phone Number",
    noPhoneNumber: "No phone number",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    save: "Save",
    edit: "Edit",
    create: "Create",
    delete: "Delete",
    continue: "Continue",
    yes: "Yes",
    no: "No",
    add: "Add",
    admin: "Admin",
    login: "Login",
    register: "Register",
    clientDetails: "Client Details",
    previous: "Previous",
    next: "Next",
    creatingAccount: "Creating Account...",
    alreadyHaveAccount: "Already have an account?",
    beforeWeContinue: "Before We Continue",
    enterPassword: "Enter password",
    loggingIn: "Logging in...",
    noAccount: "Don't have an account?",
    signUp: "Sign up",
    loading: "Loading...",
    search: "Search",
    filter: "Filter",
    all: "All",
    completed: "Completed",
    inProgress: "In Progress",
    failed: "Failed",
    userHangup: "User Hangup",
    assistantHangup: "Assistant Hangup",
    callOutcomes: "Call Outcomes",
    saving: "Saving...",
    errorFetchingData: "Error fetching data",
    errorUpdatingQA: "Error updating QA form",
    
    // Dashboard & Stats
    dashboard: "Dashboard",
    totalCalls: "Total Calls",
    incomingCalls: "Incoming Calls",
    openTickets: "Open Tickets",
    unassignedTickets: "Unassigned Tickets",
    resolvedTickets: "Resolved Tickets",
    callVolume: "Call Volume",
    callVolumeDescription: "Number of calls over time",
    recentTickets: "Recent Tickets",
    ticketStatusDescription: "Current status of all tickets",
    noResults: "No results found",
    searchTickets: "Search tickets",
    duration: "Duration",
    cost: "Cost",
    status: "Status",
    summary: "Summary",
    created: "Created",
    time: "Time",
    callsFound: "calls found",
    allStatus: "All Status",
    calls: "Calls",
    messages: "Messages",
    avgDuration: "Average Duration",
    successRate: "Success Rate",
    
    // Admin & Management
    adminPanel: "Admin Panel",
    settings: "Settings",
    users: "Users",
    assistants: "Assistants",
    role: "Role",
    logout: "Logout",
    editorPanel: "Editor Panel",
    phoneNumbers: "Phone Numbers",
    enterNewPhoneNumber: "Enter phone number",
    phoneNumberManagement: "Phone Number Management",
    user: "User",
    editor: "Editor",
    profile: "Profile",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    manageUsersAndPermissions: "Manage Users and Permissions",
    owner: "Owner",
    permissions: "Permissions",
    actions: "Actions",
    confirmDelete: "Confirm Delete",
    deleteConfirmation: "Are you sure you want to delete this?",
    temperature: "Temperature",
    maxTokens: "Max Tokens",
    errorFetchingAssistants: "Error fetching assistants",
    
    // User Management
    userManagement: "User Management",
    createUser: "Create User",
    createNewUser: "Create New User",
    createUserDescription: "Add a new user to the system",
    editUser: "Edit User",
    editUserDescription: "Modify user details and permissions",
    userCreated: "User Created",
    userCreatedDescription: "New user has been created successfully",
    userUpdated: "User Updated",
    userUpdatedDescription: "User details have been updated successfully",
    userDeleted: "User Deleted",
    userDeletedDescription: "User has been deleted successfully",
    errorCreatingUser: "Error creating user",
    errorUpdatingUser: "Error updating user",
    errorDeletingUser: "Error deleting user",
    assignedAssistants: "Assigned Assistants",
    single: "Single",
    assistantAccess: "Assistant Access",
    selectAssistant: "Select Assistant",
    assignedPhoneNumbers: "Assigned Phone Numbers",
    
    // Assistant Management
    assistantManagement: "Assistant Management",
    createAssistant: "Create Assistant",
    createNewAssistant: "Create New Assistant",
    createAssistantDescription: "Add a new assistant to the system",
    editAssistant: "Edit Assistant",
    editAssistantDescription: "Modify assistant details and settings",
    assistantCreated: "Assistant Created",
    assistantCreatedDescription: "New assistant has been created successfully",
    assistantUpdated: "Assistant Updated",
    assistantUpdatedDescription: "Assistant details have been updated successfully",
    assistantDeleted: "Assistant Deleted",
    assistantDeletedDescription: "Assistant has been deleted successfully",
    errorCreatingAssistant: "Error creating assistant",
    errorUpdatingAssistant: "Error updating assistant",
    errorDeletingAssistant: "Error deleting assistant",
    model: "Model",
    systemPrompt: "System Prompt",
    voiceId: "Voice ID",
    initialMessage: "Initial Message",
    assistant: {
      noVoiceSelected: "No voice selected",
      noInitialMessage: "No initial message"
    },
    
    // Hotel Questions
    propertyName: "Hotel/Property Name",
    location: "Location (City, Country)",
    hotelQuestions: "Hotel Questions",
    breakfastService: "Breakfast Service & Hours",
    lunchService: "Lunch Service & Hours",
    dinnerService: "Dinner Service & Hours",
    poolHours: "Pool Hours",
    spaServices: "Spa Services & Hours",
    checkoutProcedures: "Check-out Procedures & Timings",
    ironingFacilities: "Ironing Facilities (Location & Hours)",
    iceMachineLocation: "Ice Machine Location",
    kidsClubServices: "Kids' Club Services & Hours",
    synagogueServices: "Synagogue Services & Location",
    gymFacilities: "Gym Facilities & Hours",
    businessLounge: "Business Lounge Availability & Services",
    accessibilityFeatures: "Accessibility Features & Services",
    uniqueAmenities: "Unique Amenities or Services",
    contactPerson: "Contact Person",
    contactEmail: "Contact Email",
    contactPhone: "Contact Phone",
    
    // Transcript Viewer
    errorPlayingRecording: "Error playing recording",
    recentTranscripts: "Recent Transcripts",
    noTranscriptsAvailable: "No transcripts available",
    noConversationsFound: "No conversations found",
    backToConversations: "Back to Conversations",
    playRecording: "Play Recording",
    transcript: "Transcript",
    conversation: "Conversation",
    speaker: "Speaker",
    timestamp: "Timestamp",
    content: "Content",
    
    // Command Palette
    searchCommands: "Search Commands",
    noCommandsFound: "No commands found",
    shortcuts: "Shortcuts",
    navigation: "Navigation",
    theme: "Theme",
    preferences: "Preferences",
    account: "Account",
    help: "Help",
    documentation: "Documentation",
    support: "Support",
    quickActions: "Quick Actions",
    recentItems: "Recent Items",
    favorites: "Favorites",
    pressKeyToSearch: "Press / to search",
    loginDescription: "Enter your credentials to access your account",
    pauseRecording: "Pause Recording",
    stopRecording: "Stop Recording",
    selectAssistantAccess: "Select Assistant Access",
    welcomeEditor: "Welcome to the Editor Panel",
    editorQADescription: "Please fill out the following information about your hotel. This will help us provide better service to your guests. For time fields, please use the format: from HH:MM till HH:MM (e.g., from 09:00 till 13:00)",
    timeFormat: "Time format: from HH:MM till HH:MM"
  },
  he: {
    // Common
    name: "שם",
    email: "דוא״ל",
    password: "סיסמה",
    language: "שפה",
    phoneNumber: "מספר טלפון",
    noPhoneNumber: "אין מספר טלפון",
    error: "שגיאה",
    success: "הצלחה",
    cancel: "בטל",
    save: "שמור",
    edit: "ערוך",
    create: "צור",
    delete: "מחק",
    continue: "המשך",
    yes: "כן",
    no: "לא",
    add: "הוסף",
    admin: "מנהל",
    login: "התחבר",
    register: "הירשם",
    clientDetails: "פרטי לקוח",
    previous: "הקודם",
    next: "הבא",
    creatingAccount: "יוצר חשבון...",
    alreadyHaveAccount: "כבר יש לך חשבון?",
    beforeWeContinue: "לפני שממשיכים",
    enterPassword: "הכנס סיסמה",
    loggingIn: "מתחבר...",
    noAccount: "אין לך חשבון?",
    signUp: "הירשם",
    loading: "טוען...",
    search: "חיפוש",
    filter: "סינון",
    all: "הכל",
    completed: "הושלם",
    inProgress: "בתהליך",
    failed: "נכשל",
    userHangup: "ניתוק משתמש",
    assistantHangup: "ניתוק עוזר",
    callOutcomes: "תוצאות שיחה",
    saving: "שומר...",
    errorFetchingData: "שגיאה בטעינת נתונים",
    errorUpdatingQA: "שגיאה בעדכון טופס שאלות ותשובות",
    
    // Dashboard & Stats
    dashboard: "לוח בקרה",
    totalCalls: "סה״כ שיחות",
    incomingCalls: "שיחות נכנסות",
    openTickets: "כרטיסים פתוחים",
    unassignedTickets: "כרטיסים לא משויכים",
    resolvedTickets: "כרטיסים שנפתרו",
    callVolume: "נפח שיחות",
    callVolumeDescription: "מספר השיחות לאורך זמן",
    recentTickets: "כרטיסים אחרונים",
    ticketStatusDescription: "סטטוס נוכחי של כל הכרטיסים",
    noResults: "לא נמצאו תוצאות",
    searchTickets: "חפש כרטיסים",
    duration: "משך",
    cost: "עלות",
    status: "סטטוס",
    summary: "סיכום",
    created: "נוצר",
    time: "זמן",
    callsFound: "שיחות נמצאו",
    allStatus: "כל הסטטוסים",
    calls: "שיחות",
    messages: "הודעות",
    avgDuration: "משך ממוצע",
    successRate: "שיעור ההצלחה",
    
    // Admin & Management
    adminPanel: "פאנל ניהול",
    settings: "הגדרות",
    users: "משתמשים",
    assistants: "עוזרים",
    role: "תפקיד",
    logout: "התנתק",
    editorPanel: "לוח עורך",
    phoneNumbers: "מספרי טלפון",
    enterNewPhoneNumber: "הכנס מספר טלפון",
    phoneNumberManagement: "ניהול מספרי טלפון",
    user: "משתמש",
    editor: "עורך",
    profile: "פרופיל",
    lightMode: "מצב בהיר",
    darkMode: "מצב כהה",
    manageUsersAndPermissions: "ניהול משתמשים והרשאות",
    owner: "בעלים",
    permissions: "הרשאות",
    actions: "פעולות",
    confirmDelete: "אישור מחיקה",
    deleteConfirmation: "האם אתה בטוח שברצונך למחוק?",
    temperature: "טמפרטורה",
    maxTokens: "מקסימום טוקנים",
    errorFetchingAssistants: "שגיאה בטעינת העוזרים",
    
    // User Management
    userManagement: "ניהול משתמשים",
    createUser: "צור משתמש",
    createNewUser: "צור משתמש חדש",
    createUserDescription: "הוסף משתמש חדש למערכת",
    editUser: "ערוך משתמש",
    editUserDescription: "שנה פרטי משתמש והרשאות",
    userCreated: "משתמש נוצר",
    userCreatedDescription: "משתמש חדש נוצר בהצלחה",
    userUpdated: "משתמש עודכן",
    userUpdatedDescription: "פרטי המשתמש עודכנו בהצלחה",
    userDeleted: "משתמש נמחק",
    userDeletedDescription: "המשתמש נמחק בהצלחה",
    errorCreatingUser: "שגיאה ביצירת משתמש",
    errorUpdatingUser: "שגיאה בעדכון משתמש",
    errorDeletingUser: "שגיאה במחיקת משתמש",
    assignedAssistants: "עוזרים משויכים",
    single: "בודד",
    assistantAccess: "גישה לעוזרים",
    selectAssistant: "בחר עוזר",
    assignedPhoneNumbers: "מספרי טלפון משויכים",
    
    // Assistant Management
    assistantManagement: "ניהול עוזרים",
    createAssistant: "צור עוזר",
    createNewAssistant: "צור עוזר חדש",
    createAssistantDescription: "הוסף עוזר חדש למערכת",
    editAssistant: "ערוך עוזר",
    editAssistantDescription: "שנה פרטי עוזר והגדרות",
    assistantCreated: "עוזר נוצר",
    assistantCreatedDescription: "עוזר חדש נוצר בהצלחה",
    assistantUpdated: "עוזר עודכן",
    assistantUpdatedDescription: "פרטי העוזר עודכנו בהצלחה",
    assistantDeleted: "עוזר נמחק",
    assistantDeletedDescription: "העוזר נמחק בהצלחה",
    errorCreatingAssistant: "שגיאה ביצירת עוזר",
    errorUpdatingAssistant: "שגיאה בעדכון עוזר",
    errorDeletingAssistant: "שגיאה במחיקת עוזר",
    model: "מודל",
    systemPrompt: "הנחיית מערכת",
    voiceId: "מזהה קול",
    initialMessage: "הודעה ראשונית",
    assistant: {
      noVoiceSelected: "לא נבחר קול",
      noInitialMessage: "לא נבחר הודעה ראשונית"
    },
    
    // Hotel Questions
    propertyName: "שם המלון/הנכס",
    location: "מיקום (עיר, מדינה)",
    hotelQuestions: "שאלות מלון",
    breakfastService: "שירות ושעות ארוחת בוקר",
    lunchService: "שירות ושעות ארוחת צהריים",
    dinnerService: "שירות ושעות ארוחת ערב",
    poolHours: "שעות בריכה",
    spaServices: "שירותי ספא ושעות",
    checkoutProcedures: "נהלי ושעות צ'ק-אאוט",
    ironingFacilities: "מתקני גיהוץ (מיקום ושעות)",
    iceMachineLocation: "מיקום מכונת קרח",
    kidsClubServices: "שירותי מועדון ילדים ושעות",
    synagogueServices: "שירותי בית כנסת ומיקום",
    gymFacilities: "מתקני כושר ושעות",
    businessLounge: "זמינות ושירותי טרקלין עסקים",
    accessibilityFeatures: "מאפייני ושירותי נגישות",
    uniqueAmenities: "שירותים ומתקנים ייחודיים",
    contactPerson: "איש קשר",
    contactEmail: "דוא״ל ליצירת קשר",
    contactPhone: "טלפון ליצירת קשר",
    
    // Transcript Viewer
    errorPlayingRecording: "שגיאה בהשמעת ההקלטה",
    recentTranscripts: "תמלילים אחרונים",
    noTranscriptsAvailable: "אין תמלילים זמינים",
    noConversationsFound: "לא נמצאו שיחות",
    backToConversations: "חזרה לשיחות",
    playRecording: "הפעל הקלטה",
    transcript: "תמליל",
    conversation: "שיחה",
    speaker: "דובר",
    timestamp: "חותמת זמן",
    content: "תוכן",
    
    // Command Palette
    searchCommands: "חיפוש פקודות",
    noCommandsFound: "לא נמצאו פקודות",
    shortcuts: "קיצורי דרך",
    navigation: "ניווט",
    theme: "ערכת נושא",
    preferences: "העדפות",
    account: "חשבון",
    help: "עזרה",
    documentation: "תיעוד",
    support: "תמיכה",
    quickActions: "פעולות מהירות",
    recentItems: "פריטים אחרונים",
    favorites: "מועדפים",
    pressKeyToSearch: "לחץ / לחיפוש",
    loginDescription: "הזן את פרטי ההתחברות שלך כדי לגשת לחשבונך",
    pauseRecording: "השהה הקלטה",
    stopRecording: "עצור הקלטה",
    selectAssistantAccess: "בחר גישה לעוזר",
    welcomeEditor: "ברוך הבא לפאנל העורך",
    editorQADescription: "אנא מלא את המידע הבא על המלון שלך. זה יעזור לנו לספק שירות טוב יותר לאורחים שלך. עבור שדות זמן, אנא השתמש בפורמט: מ-HH:MM עד HH:MM (לדוגמה, מ-09:00 עד 13:00)",
    timeFormat: "פורמט זמן: מ-HH:MM עד HH:MM"
  }
} as const;

export type Language = keyof typeof translations;
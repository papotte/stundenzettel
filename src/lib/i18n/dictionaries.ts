// TODO: Clean up unused translation keys
// After all recent changes, check for any keys that are no longer used in the codebase
// and remove them to keep the dictionaries clean and maintainable.
//
// Steps to identify unused keys:
// 1. Search for all t('key') calls in the codebase
// 2. Compare with keys defined in dictionaries
// 3. Remove any keys that are no longer referenced
// 4. Test the app to ensure no missing key errors
//
export const dictionaries = {
  en: {
    appName: 'TimeWise Tracker',
    // Login Page
    login: {
      testMode: 'TimeWise Tracker (Test Mode)',
      selectMockUser: 'Select a Mock User',
      mockUserDescription:
        'Choose a user to log in as for local testing. Data is stored in-memory and will be reset on page reload.',
      loginAs: 'Log in as {displayName}',
      signInTab: 'Sign In',
      signUpTab: 'Sign Up',
      signInTitle: 'Sign In',
      signInDescription: 'Enter your credentials to access your time tracker.',
      emailLabel: 'Email',
      emailPlaceholder: 'm@example.com',
      passwordLabel: 'Password',
      signInButton: 'Sign In',
      signingInButton: 'Signing In...',
      signUpTitle: 'Sign Up',
      signUpDescription: 'Create a new account to start tracking your time.',
      signUpButton: 'Sign Up',
      creatingAccountButton: 'Creating Account...',
      continueWith: 'Or continue with',
      signInWithGoogle: 'Sign in with Google',
      authFailedTitle: 'Authentication Failed',
    },
    // Main Tracker Page
    tracker: {
      liveTrackingTitle: 'Live Time Tracking',
      liveTrackingDescription:
        'Start the timer to track your work as it happens.',
      runningTimerLocation: 'Location: {location}',
      stopButton: 'Stop',
      locationPlaceholder: 'Where are you working from?',
      getLocationTooltip: 'Get current location',
      startButton: 'Start Tracking',
      dailyActionsTitle: 'Daily Actions',
      dailyActionsDescription:
        'Quickly add entries for the selected day: {date}',
      timeEntriesTitle: 'Time Entries',
      addEntryButton: 'Add',
      entriesForDate: 'Entries for {date}',
      todaysEntries: 'Entries for {date} – Today',
      noEntries: 'No entries for this day.',
      addFirstEntryLink: 'Add your first entry',
      summaryTitle: 'Hours Summary',
      summaryDescription:
        'Total compensated hours for periods related to the selected date.',
      summaryDay: 'Selected Day',
      summaryWeek: 'This Week',
      summaryMonth: 'This Month',
      headerExportLink: 'Preview & Export',
      headerClearDataTooltip: 'Clear all data',
      headerSettingsTooltip: 'Settings',
      headerUserMenuTooltip: 'User Menu',
      headerSignOutTooltip: 'Sign Out',
      clearDataAlertTitle: 'Are you absolutely sure?',
      clearDataAlertDescription:
        'This action cannot be undone. This will permanently delete all your time tracking data from the database.',
      clearDataAlertCancel: 'Cancel',
      clearDataAlertConfirm: 'Yes, delete everything',
    },
    // Special Locations
    special_locations: {
      SICK_LEAVE: 'Sick Leave',
      PTO: 'Paid Time Off',
      BANK_HOLIDAY: 'Bank Holiday',
      TIME_OFF_IN_LIEU: 'Time Off in Lieu',
    },
    // Time Entry Card
    time_entry_card: {
      editLabel: 'Edit',
      deleteLabel: 'Delete',
      deleteAlertTitle: 'Are you sure?',
      deleteAlertDescription:
        'This action cannot be undone. This will permanently delete the time entry for "{location}".',
      deleteAlertCancel: 'Cancel',
      deleteAlertConfirm: 'Delete',
      pauseLabel: '{minutes}m pause',
      travelLabel: '{hours}h travel',
      driverLabel: 'Driver',
      runningLabel: 'Now',
      drivingLabel: '{hours}h driving',
      passengerLabel: '{hours}h passenger',
    },
    // Time Entry Form
    time_entry_form: {
      addTitle: 'Add Time Entry',
      editTitle: 'Edit Time Entry',
      addDescription: 'Manually add a new time entry for your records.',
      editDescription: 'Update the details of your time entry.',
      locationLabel: 'Location',
      locationPlaceholder: 'e.g., Office, Home',
      dateLabel: 'Date',
      pickDate: 'Pick a date',
      startTimeLabel: 'Start time',
      endTimeLabel: 'End time',
      optionalDetailsTitle: 'Optional Details',
      pauseLabel: 'Pause',
      pauseDurationLabel: 'Pause Duration (HH:mm)',
      pauseDurationDescription:
        'Enter the total duration of your pause in HH:mm format (e.g. {example} for 30 minutes).',
      pauseDurationInvalid:
        'Please enter a valid duration in HH:mm format (e.g. {example}).',
      pauseSuggestion: 'Suggest: {minutes} min',
      pauseSuggestionTooltip:
        'Activity over {hours}. Recommended pause: {minutes} mins.',
      travelTimeLabel: 'Travel Time (hours)',
      travelTimePlaceholder: 'e.g. 1.5',
      driverLabel: 'Driver',
      driverDescription: 'Were you the designated driver?',
      driverTimeLabel: 'Driving Time (as Driver)',
      passengerTimeLabel: 'Driving Time (as Passenger)',
      passengerTimeTotalLabel: 'Time as Passenger',
      totalTimeLabel: 'Total Compensated Time:',
      warning10HoursTitle: 'Warning: Exceeds 10 Hours',
      warning10HoursDescription:
        'The work duration exceeds the legal maximum of 10 hours per day.',
      cancelButton: 'Cancel',
      saveButton: 'Save Entry',
      cancelConfirmTitle: 'Discard changes?',
      cancelConfirmDescription:
        'Are you sure you want to cancel? Unsaved changes will be lost.',
      cancelConfirmAbort: 'Keep editing',
      cancelConfirmConfirm: 'Discard',
      locationFetchToastTitle: 'Fetching location...',
      locationFetchToastDescription: 'Please wait while we get your address.',
      locationFetchedToastTitle: 'Location fetched!',
      locationFetchedToastDescription:
        'Your location has been set to "{address}".',
      locationErrorToastTitle: 'Could not get address',
      locationCoordsErrorToastTitle: 'Could not get your coordinates',
      locationCoordsErrorToastDescription:
        'Please ensure location services are enabled and permission is granted in your browser.',
      geolocationNotSupportedToastTitle: 'Geolocation not supported',
      geolocationNotSupportedToastDescription:
        'Your browser does not support geolocation.',
      entryModeLabel: 'Entry mode',
      modeInterval: 'By interval',
      modeDuration: 'By duration',
      durationLabel: 'Duration',
      durationFormLabel: 'Duration (minutes)',
      durationInvalid:
        'Please enter a valid duration in minutes. Minimum is 5 minutes.',
      compensatedInfo:
        'Compensated time = Worked time - Pause + Driver time × {driver}% + Passenger time × {passenger}%',
    },
    // Toasts
    toasts: {
      locationRequiredTitle: 'Location required',
      locationRequiredDescription: 'Please enter a location to start tracking.',
      entryUpdatedTitle: 'Entry Updated',
      entryUpdatedDescription: 'Changes to "{location}" have been saved.',
      entryAddedTitle: 'Entry Added',
      entryAddedDescription: 'New entry for "{location}" created.',
      saveFailedTitle: 'Save Failed',
      saveFailedDescription: 'There was a problem saving your entry.',
      entryDeletedTitle: 'Entry Deleted',
      deleteFailedTitle: 'Delete Failed',
      deleteFailedDescription: 'There was a problem deleting your entry.',
      dataClearedTitle: 'Data Cleared',
      dataClearedDescription:
        'All your time entries have been removed from the database.',
      clearFailedTitle: 'Clear Failed',
      clearFailedDescription: 'There was a problem clearing your data.',
      entryExistsTitle: 'Entry already exists',
      entryExistsDescription:
        'An entry for "{location}" on this day already exists.',
      configurationErrorTitle: 'Configuration Error',
      configurationErrorDescription:
        'Firebase is not configured correctly. Please check your environment variables.',
      databaseErrorTitle: 'Database Connection Error',
      databaseConnectionError:
        "Could not connect to the database. Please see the 'Troubleshooting' section in the README.md file.",
    },
    // Settings Page
    settings: {
      backButton: 'Back to Tracker',
      title: 'User Settings',
      description: 'Manage your personal application settings here.',
      defaultWorkHoursLabel: 'Default daily work hours',
      defaultWorkHoursDescription:
        'Used for Sick Leave, PTO, and Bank Holiday entries.',
      defaultStartTimeLabel: 'Default start time',
      defaultEndTimeLabel: 'Default end time',
      timeUsageDescription: 'Used for new time entries.',
      defaultIsDriverLabel: 'Default to main driver',
      defaultIsDriverDescription:
        'If enabled, new entries will have "main driver" checked by default.',
      languageLabel: 'Language',
      languageEnglish: 'English',
      languageGerman: 'German',
      languageDescription: 'Choose the display language of the application.',
      companyDetailsTitle: 'Company Details',
      companyDetailsDescription:
        'This information will be displayed on your exported timesheets.',
      companyNameLabel: 'Company Name',
      companyEmailLabel: 'Company Email',
      companyPhone1Label: 'Phone Number 1',
      companyPhone2Label: 'Phone Number 2',
      companyFaxLabel: 'Fax Number',
      saveButton: 'Save Settings',
      errorLoadingTitle: 'Error',
      errorLoadingDescription: 'Could not load your settings.',
      savedTitle: 'Settings Saved',
      savedDescription: 'Your new settings have been applied.',
      errorSavingTitle: 'Error',
      errorSavingDescription: 'Could not save your settings.',
      displayNameLabel: 'Display Name',
      displayNameDescription:
        'This name will appear on your export preview and Excel file. Leave blank to use your account name.',
      displayNamePlaceholder: 'e.g. John Doe',
      driverCompensationPercentLabel: 'Driver time compensation (%)',
      driverCompensationPercentDescription:
        'Percentage of driving time as driver that is counted as compensated time.',
      passengerCompensationPercentLabel: 'Passenger time compensation (%)',
      passengerCompensationPercentDescription:
        'Percentage of driving time as passenger that is counted as compensated time.',
      // Subscription Management
      subscriptionTitle: 'Subscription',
      subscriptionDescription: 'Manage your subscription and billing.',
      subscriptionStatus: 'Status',
      nextBilling: 'Next billing date',
      manageBilling: 'Manage Billing',
      upgrade: 'Upgrade',
      noSubscription: 'No active subscription',
      getStarted: 'Get Started',
      active: 'Active',
      inactive: 'Inactive',
      // Team Management
      teamsTitle: 'Teams',
      teamsDescription: 'Manage your team memberships.',
      manageTeams: 'Manage Teams',
      owner: 'Owner',
      member: 'Member',
      errorPortalTitle: 'Portal Error',
      errorPortalDescription:
        'Failed to open billing portal. Please try again.',
      noTeams: 'You are not part of any teams yet.',
      createFirstTeam: 'Create First Team',
      createNewTeam: 'Create New Team',
      // New Settings Navigation
      preferences: 'My Preferences',
      preferencesDescription: 'Personal settings and display preferences',
      company: 'Company',
      companyDescription: 'Company information for exports',
      security: 'Security',
      securityDescription: 'Password and account management',
      manageTeam: 'Manage Team',
      manageTeamDescription: 'Team memberships and permissions',
      manageSubscription: 'Manage Subscription',
      manageSubscriptionDescription: 'Billing and subscription settings',
      // Security Section
      changePassword: 'Change Password',
      changePasswordDescription: 'Update your account password',
      deleteAccount: 'Delete Account',
      deleteAccountDescription: 'Permanently delete your account and all data',
      deleteAccountWarning:
        'This action cannot be undone. All your data will be permanently deleted.',
      // Navigation
      backToTracker: 'Back to Tracker',
      // Form fields
      selectLanguage: 'Select language',
      defaultStartTime: 'Default Start Time',
      defaultStartTimeDescription: 'Default start time for new entries.',
      defaultEndTime: 'Default End Time',
      defaultEndTimeDescription: 'Default end time for new entries.',
      companyNamePlaceholder: 'Your Company Name',
      companyEmailPlaceholder: 'contact@company.com',
      companyEmailDescription: 'Contact email for your company.',
      companyPhone1Placeholder: '+1 234 567 890',
      companyPhone2Placeholder: '+1 234 567 891',
      companyFaxPlaceholder: '+1 234 567 892',
      compensationSettings: 'Compensation Settings',
      // Security page
      accountEmail: 'Account Email',
      password: 'Password',
      passwordDescription: 'Change your account password',
      twoFactorAuth: 'Two-Factor Authentication',
      twoFactorAuthDescription:
        'Add an extra layer of security to your account',
      dangerZone: 'Danger Zone',
      dangerZoneDescription: 'Irreversible and destructive actions',
      signOutDescription: 'Sign out of your account',
      deleteAccountConfirmTitle: 'Are you absolutely sure?',
      deleteAccountConfirmDescription:
        'This action cannot be undone. All your data will be permanently deleted.',

      // Team page
      noTeamsDescription:
        'You are not part of any teams yet. Create your first team to start collaborating.',
      teamMembers: '{count} members',
      manageAllTeams: 'Manage All Teams',
      // Subscription page
      noSubscriptionDescription:
        'Upgrade to a paid plan to unlock all features.',
      unknownPlan: 'Unknown Plan',
      changePlan: 'Change Plan',
      trialing: 'Trial',
      // Common
      saving: 'Saving...',
    },
    // Pricing Page
    pricing: {
      title: 'Choose Your Plan',
      subtitle: 'Select the perfect plan for your time tracking needs',
      loadingPlans: 'Loading plans...',
      monthly: 'Monthly',
      yearly: 'Yearly',
      save20: 'Save 20%',
      perUserPerMonth: 'per user per month',
      month: 'month',
      year: 'year',
      upTo: 'Up to',
      users: 'users',
      mostPopular: 'Most Popular',
      getStarted: 'Get Started',
      createTeam: 'Create Team',
      processing: 'Processing...',
      faqTitle: 'Frequently Asked Questions',
      faq1Question: 'Can I cancel anytime?',
      faq1Answer:
        "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
      faq2Question: 'What payment methods do you accept?',
      faq2Answer:
        'We accept all major credit cards and debit cards through our secure payment processor.',
      faq3Question: 'Is there a free trial?',
      faq3Answer:
        'Yes, we offer a 14-day free trial for all plans. No credit card required to start.',
      faq4Question: 'Can I change plans later?',
      faq4Answer:
        'Absolutely! You can upgrade or downgrade your plan at any time from your account settings.',
      loginRequiredTitle: 'Login Required',
      loginRequiredDescription: 'Please log in to subscribe to a plan.',
      errorTitle: 'Payment Error',
      errorDescription:
        'There was an error processing your payment. Please try again.',
    },
    // Subscription Guard
    subscription: {
      checking: 'Checking subscription...',
      loginRequiredTitle: 'Login Required',
      loginRequiredDescription: 'Please log in to access this feature.',
      loginButton: 'Log In',
      requiredTitle: 'Subscription Required',
      requiredDescription:
        'You need an active subscription to access this feature.',
      choosePlanButton: 'Choose a Plan',
      manageSubscriptionButton: 'Manage Subscription',
    },
    // Teams Page
    teams: {
      title: 'Team Management',
      subtitle: 'Manage your teams and team members',
      createTeam: 'Create Team',
      noTeamsTitle: 'No Teams Yet',
      noTeamsDescription:
        'Create your first team to start collaborating with others.',
      createFirstTeam: 'Create First Team',
      yourTeams: 'Your Teams',
      owner: 'Owner',
      member: 'Member',
      subscription: 'Subscription',
      currentPeriod: 'Current period',
      licensedUsers: 'Licensed users',
      manageBilling: 'Manage Billing',
      upgrade: 'Upgrade',
      noSubscription: 'No active subscription',
      getStarted: 'Get Started',
      members: 'Members',
      joined: 'Joined',
      inviteMember: 'Invite Member',
      manage: 'Manage',
      errorLoadingTitle: 'Error Loading Teams',
      errorLoadingDescription: 'Failed to load your teams. Please try again.',
      errorPortalTitle: 'Portal Error',
      errorPortalDescription:
        'Failed to open billing portal. Please try again.',
      roles: {
        owner: 'Owner',
        admin: 'Admin',
        member: 'Member',
      },
    },
    // Export Page
    export_page: {
      backButton: 'Back to Tracker',
    },
    // Export Preview Component
    export_preview: {
      exportButton: 'Export to Excel',
      exportPdfButton: 'Download PDF',
      timesheetTitle: 'Timesheet for the month: {month}',
      headerCompany: 'Name and Phone / Radio:',
      headerWeek: 'Week',
      headerDate: 'Date',
      headerLocation: 'Location',
      headerWorkTime: 'Actual Work Time',
      headerPauseDuration: 'Pause (hrs)',
      headerDriverTime: 'Driver Time (hrs)',
      headerPassengerTime: 'Passenger Time (hrs)',
      headerCompensatedTime: 'Compensated Hours',
      headerFrom: 'From',
      headerTo: 'To',
      footerTotalPerWeek: 'Total per week:',
      footerTotalHours: 'Total hours:',
      footerTotalAfterConversion: 'Total after conversion:',
      driverMark: 'D',
      locationNotFound: 'Location not found',
      headerMileage: 'Mileage/Expenses',
      signatureLine: 'Signature:',
      noDataHint: 'No data available for export in this month.',
      noDataTitle: 'No data to export',
      noDataDescription:
        'There are no entries for the selected month. Please add entries before exporting.',
    },
    // Bottom Navigation
    bottomNav: {
      home: 'Home',
      export: 'Preview & Export',
      settings: 'Settings',
      signOut: 'Sign Out',
    },
    topNav: {
      features: 'Features',
      pricing: 'Pricing',
      login: 'Log in',
    },
    // Landing Page
    landing: {
      heroTitle: 'Effortless Time Tracking for Your Business',
      heroDescription:
        'TimeWise Tracker helps you and your team manage work hours seamlessly. From live tracking to detailed exports, we have you covered.',
      getStarted: 'Get Started',
      learnMore: 'Learn More',
      features: {
        keyFeatures: 'Key Features',
        headerTag: 'Track Time Smarter',
        headerTitle: "Everything you need, nothing you don't.",
        headerDescription:
          'TimeWise Tracker is packed with features designed to make your time tracking as effortless and accurate as possible.',
        list: [
          {
            title: 'Live Time Tracking',
            desc: 'Start and stop a timer with one click. Your work duration is recorded accurately without any manual calculations.',
          },
          {
            title: 'Manual & Special Entries',
            desc: 'Easily add or edit entries for past work, or log sick leave, PTO, and holidays with dedicated entry types.',
          },
          {
            title: 'Location & Travel',
            desc: 'Automatically fetch your current location or manually input it. Track travel time and driver status for accurate compensation.',
          },
          {
            title: 'Seamless Export',
            desc: 'Generate professional-looking timesheets in Excel and PDF formats, ready to be sent for payroll or records.',
          },
          {
            title: 'Smart Suggestions',
            desc: 'The app learns your habits and suggests locations and times based on your previous entries to speed up your workflow.',
          },
          {
            title: 'Automatic Pause Calculation',
            desc: 'Based on your work duration, the app suggests the legally required pause time, which you can apply with one click.',
          },
        ],
      },
      pricing: {
        headerTitle: 'Simple, Transparent Pricing',
        headerDescription:
          'One plan that includes everything you need. No tiers, no add-ons, no surprises.',
        planTitle: 'Pro Plan',
        planDescription:
          'Everything you need to accurately track time for you and your team, generate reports, and stay organized.',
        whatsIncluded: 'What’s included',
        includedFeatures: [
          'Live Time Tracking',
          'Manual Time Entries',
          'Special Entries (Sick, PTO, etc.)',
          'Location & Travel Tracking',
          'Excel & PDF Exports',
          'Multi-language Support (EN/DE)',
          'Unlimited Entries',
          'Secure Cloud Storage',
        ],
        payPerUser: 'Pay per user, per month',
        price: '10€',
        priceCurrency: 'EUR',
        getAccess: 'Get access',
        footnote:
          'Invoices and receipts available for easy company reimbursement.',
      },
      faqTitle: 'Frequently Asked Questions',
      faqs: [
        {
          question: 'Is there a free trial available?',
          answer:
            'Yes, you can sign up and use TimeWise Tracker with all its features for free for 14 days. No credit card is required to start your trial.',
        },
        {
          question: 'Can I track time for multiple projects or clients?',
          answer:
            "Absolutely. The 'Location' field can be used to specify different projects, clients, or tasks. Our upcoming features will include dedicated project and client management for even better organization.",
        },
        {
          question: 'How does the Excel and PDF export work?',
          answer:
            'From the "Preview & Export" page, you can select any month and download a professionally formatted timesheet. The Excel file is ready for calculations, and the PDF is perfect for printing and signing.',
        },
        {
          question: 'Is my data secure?',
          answer:
            'Yes, your data is securely stored using Firebase, a platform by Google. We use industry-standard security practices to ensure your information is safe.',
        },
      ],
      footer: {
        copyright: '© 2025 TimeWise Tracker. All rights reserved.',
        terms: 'Terms of Service',
        privacy: 'Privacy',
        imprint: 'Imprint',
        cookiePolicy: 'Cookie Policy',
      },
    },
  },
  de: {
    appName: 'TimeWise Tracker',
    // Login Page
    login: {
      testMode: 'TimeWise Tracker (Testmodus)',
      selectMockUser: 'Wählen Sie einen Testbenutzer',
      mockUserDescription:
        'Wählen Sie einen Benutzer, um sich für lokale Tests anzumelden. Die Daten werden im Speicher gehalten und beim Neuladen der Seite zurückgesetzt.',
      loginAs: 'Als {displayName} anmelden',
      signInTab: 'Anmelden',
      signUpTab: 'Registrieren',
      signInTitle: 'Anmelden',
      signInDescription:
        'Geben Sie Ihre Anmeldedaten ein, um auf Ihre Zeiterfassung zuzugreifen.',
      emailLabel: 'E-Mail',
      emailPlaceholder: 'm@beispiel.com',
      passwordLabel: 'Passwort',
      signInButton: 'Anmelden',
      signingInButton: 'Anmeldung läuft...',
      signUpTitle: 'Registrieren',
      signUpDescription:
        'Erstellen Sie ein neues Konto, um mit der Zeiterfassung zu beginnen.',
      signUpButton: 'Registrieren',
      creatingAccountButton: 'Konto wird erstellt...',
      continueWith: 'Oder weiter mit',
      signInWithGoogle: 'Mit Google anmelden',
      authFailedTitle: 'Anmeldung fehlgeschlagen',
    },
    // Main Tracker Page
    tracker: {
      liveTrackingTitle: 'Live-Zeiterfassung',
      liveTrackingDescription:
        'Starten Sie den Timer, um Ihre Arbeit in Echtzeit zu erfassen.',
      runningTimerLocation: 'Ort: {location}',
      stopButton: 'Stopp',
      locationPlaceholder: 'Wo arbeiten Sie gerade?',
      getLocationTooltip: 'Aktuellen Standort abrufen',
      startButton: 'Erfassung starten',
      dailyActionsTitle: 'Tägliche Aktionen',
      dailyActionsDescription:
        'Fügen Sie schnell Einträge für den ausgewählten Tag hinzu: {date}',
      timeEntriesTitle: 'Zeiteinträge',
      addEntryButton: 'Hinzufügen',
      entriesForDate: 'Einträge für {date}',
      todaysEntries: 'Einträge für {date} – Heute',
      noEntries: 'Keine Einträge für diesen Tag.',
      addFirstEntryLink: 'Fügen Sie Ihren ersten Eintrag hinzu',
      summaryTitle: 'Stundenübersicht',
      summaryDescription:
        'Gesamtvergütete Stunden für Zeiträume bezogen auf das ausgewählte Datum.',
      summaryDay: 'Ausgewählter Tag',
      summaryWeek: 'Diese Woche',
      summaryMonth: 'Dieser Monat',
      headerExportLink: 'Vorschau & Export',
      headerClearDataTooltip: 'Alle Daten löschen',
      headerSettingsTooltip: 'Einstellungen',
      headerUserMenuTooltip: 'Benutzermenü',
      headerSignOutTooltip: 'Abmelden',
      clearDataAlertTitle: 'Sind Sie absolut sicher?',
      clearDataAlertDescription:
        'Diese Aktion kann nicht rückgängig gemacht werden. Dadurch werden alle Ihre Zeiterfassungsdaten endgültig aus der Datenbank gelöscht.',
      clearDataAlertCancel: 'Abbrechen',
      clearDataAlertConfirm: 'Ja, alles löschen',
    },
    // Special Locations
    special_locations: {
      SICK_LEAVE: 'Krankschreibung',
      PTO: 'Urlaub',
      BANK_HOLIDAY: 'Feiertag',
      TIME_OFF_IN_LIEU: 'Stundenabbau',
    },
    // Time Entry Card
    time_entry_card: {
      editLabel: 'Bearbeiten',
      deleteLabel: 'Löschen',
      deleteAlertTitle: 'Sind Sie sicher?',
      deleteAlertDescription:
        'Diese Aktion kann nicht rückgängig gemacht werden. Der Zeiteintrag für "{location}" wird dauerhaft gelöscht.',
      deleteAlertCancel: 'Abbrechen',
      deleteAlertConfirm: 'Löschen',
      pauseLabel: '{minutes}m Pause',
      pauseDurationLabel: 'Pausendauer (HH:mm)',
      pauseDurationDescription:
        'Geben Sie die Gesamtdauer Ihrer Pause im Format HH:mm ein (z.B. {example} für 30 Minuten).',
      pauseDurationInvalid:
        'Bitte geben Sie eine gültige Dauer im Format HH:mm ein (z.B. {example}).',
      travelLabel: '{hours} Std. Fahrt',
      driverLabel: 'Fahrer',
      runningLabel: 'Jetzt',
      drivingLabel: '{hours} Std. Fahrer',
      passengerLabel: '{hours} Std. Beifahrer',
    },
    // Time Entry Form
    time_entry_form: {
      addTitle: 'Zeiteintrag hinzufügen',
      editTitle: 'Zeiteintrag bearbeiten',
      addDescription:
        'Fügen Sie manuell einen neuen Zeiteintrag für Ihre Unterlagen hinzu.',
      editDescription: 'Aktualisieren Sie die Details Ihres Zeiteintrags.',
      locationLabel: 'Einsatzort',
      locationPlaceholder: 'z.B. Büro, Zuhause',
      dateLabel: 'Datum',
      pickDate: 'Datum auswählen',
      startTimeLabel: 'Startzeit',
      endTimeLabel: 'Endzeit',
      optionalDetailsTitle: 'Optionale Angaben',
      pauseLabel: 'Pause',
      pauseDurationLabel: 'Pause Duration (HH:mm)',
      pauseDurationDescription:
        'Enter the total duration of your pause in HH:mm format (e.g. {example} for 30 minutes).',
      pauseDurationInvalid:
        'Please enter a valid duration in HH:mm format (e.g. {example}).',
      pauseSuggestion: 'Vorschlag: {minutes} Min.',
      pauseSuggestionTooltip:
        'Aktivität über {hours}. Empfohlene Pause: {minutes} Min.',
      travelTimeLabel: 'Fahrtzeit (Stunden)',
      travelTimePlaceholder: 'z.B. 1,5',
      driverLabel: 'Fahrer',
      driverDescription: 'Waren Sie der designierte Fahrer?',
      driverTimeLabel: 'Fahrzeit (als Fahrer)',
      passengerTimeLabel: 'Fahrzeit (als Beifahrer)',
      passengerTimeTotalLabel: 'Zeit als Beifahrer',
      totalTimeLabel: 'Vergütete Gesamtzeit:',
      warning10HoursTitle: 'Warnung: 10 Stunden überschritten',
      warning10HoursDescription:
        'Die Arbeitsdauer überschreitet das gesetzliche Maximum von 10 Stunden pro Tag.',
      cancelButton: 'Abbrechen',
      saveButton: 'Eintrag speichern',
      cancelConfirmTitle: 'Änderungen verwerfen?',
      cancelConfirmDescription:
        'Sind Sie sicher, dass Sie abbrechen möchten? Nicht gespeicherte Änderungen gehen verloren.',
      cancelConfirmAbort: 'Weiter bearbeiten',
      cancelConfirmConfirm: 'Verwerfen',
      locationFetchToastTitle: 'Standort wird abgerufen...',
      locationFetchToastDescription:
        'Bitte warten Sie, während wir Ihre Adresse abrufen.',
      locationFetchedToastTitle: 'Standort abgerufen!',
      locationFetchedToastDescription:
        'Ihr Standort wurde auf "{address}" gesetzt.',
      locationErrorToastTitle: 'Adresse konnte nicht abgerufen werden',
      locationCoordsErrorToastTitle:
        'Ihre Koordinaten konnten nicht abgerufen werden',
      locationCoordsErrorToastDescription:
        'Bitte stellen Sie sicher, dass die Ortungsdienste aktiviert und die Berechtigung in Ihrem Browser erteilt ist.',
      geolocationNotSupportedToastTitle: 'Geolokalisierung nicht unterstützt',
      geolocationNotSupportedToastDescription:
        'Ihr Browser unterstützt keine Geolokalisierung.',
      entryModeLabel: 'Erfassungsmodus',
      modeInterval: 'Nach Zeitraum',
      modeDuration: 'Nach Dauer',
      durationLabel: 'Dauer',
      durationFormLabel: 'Dauer (Minuten)',
      durationInvalid:
        'Bitte geben Sie eine gültige Dauer in Minuten ein. Mindestdauer ist 5 Minuten.',
      compensatedInfo:
        'Vergütete Zeit = Arbeitszeit - Pause + Fahrerzeit × {driver}% + Beifahrerzeit × {passenger}%',
    },
    // Toasts
    toasts: {
      locationRequiredTitle: 'Standort erforderlich',
      locationRequiredDescription:
        'Bitte geben Sie einen Standort ein, um die Erfassung zu starten.',
      entryUpdatedTitle: 'Eintrag aktualisiert',
      entryUpdatedDescription: 'Änderungen an "{location}" wurden gespeichert.',
      entryAddedTitle: 'Eintrag hinzugefügt',
      entryAddedDescription: 'Neuer Eintrag für "{location}" wurde erstellt.',
      saveFailedTitle: 'Speichern fehlgeschlagen',
      saveFailedDescription:
        'Beim Speichern Ihres Eintrags ist ein Problem aufgetreten.',
      entryDeletedTitle: 'Eintrag gelöscht',
      deleteFailedTitle: 'Löschen fehlgeschlagen',
      deleteFailedDescription:
        'Beim Löschen Ihres Eintrags ist ein Problem aufgetreten.',
      dataClearedTitle: 'Daten gelöscht',
      dataClearedDescription:
        'Alle Ihre Zeiterfassungseinträge wurden aus der Datenbank entfernt.',
      clearFailedTitle: 'Löschen fehlgeschlagen',
      clearFailedDescription:
        'Beim Löschen Ihrer Daten ist ein Problem aufgetreten.',
      entryExistsTitle: 'Eintrag existiert bereits',
      entryExistsDescription:
        'Ein Eintrag für "{location}" an diesem Tag existiert bereits.',
      configurationErrorTitle: 'Konfigurationsfehler',
      configurationErrorDescription:
        'Firebase ist nicht korrekt konfiguriert. Bitte überprüfen Sie Ihre Umgebungsvariablen.',
      databaseErrorTitle: 'Datenbank-Verbindungsfehler',
      databaseConnectionError:
        "Verbindung zur Datenbank fehlgeschlagen. Bitte lesen Sie den Abschnitt 'Fehlerbehebung' in der README.md-Datei.",
    },
    // Settings Page
    settings: {
      backButton: 'Zurück zur Übersicht',
      title: 'Benutzereinstellungen',
      description:
        'Verwalten Sie hier Ihre persönlichen Anwendungseinstellungen.',
      defaultWorkHoursLabel: 'Tägliche Standardarbeitszeit',
      defaultWorkHoursDescription:
        'Wird für Krankheits-, Urlaubs- und Feiertagseinträge verwendet.',
      defaultStartTimeLabel: 'Standard-Startzeit',
      defaultEndTimeLabel: 'Standard-Endzeit',
      timeUsageDescription: 'Wird für neue Zeiteinträge verwendet.',
      defaultIsDriverLabel: 'Standardmäßig als Fahrer',
      defaultIsDriverDescription:
        'Wenn aktiviert, ist "Fahrer" bei neuen Einträgen standardmäßig ausgewählt.',
      languageLabel: 'Sprache',
      languageEnglish: 'Englisch',
      languageGerman: 'Deutsch',
      languageDescription: 'Wählen Sie die Anzeigesprache der Anwendung.',
      companyDetailsTitle: 'Firmendetails',
      companyDetailsDescription:
        'Diese Informationen werden auf Ihren exportierten Stundenzetteln angezeigt.',
      companyNameLabel: 'Firmenname',
      companyEmailLabel: 'Firmen-E-Mail',
      companyPhone1Label: 'Telefonnummer 1',
      companyPhone2Label: 'Telefonnummer 2',
      companyFaxLabel: 'Faxnummer',
      saveButton: 'Einstellungen speichern',
      errorLoadingTitle: 'Fehler',
      errorLoadingDescription:
        'Ihre Einstellungen konnten nicht geladen werden.',
      savedTitle: 'Einstellungen gespeichert',
      savedDescription: 'Ihre neuen Einstellungen wurden übernommen.',
      errorSavingTitle: 'Fehler',
      errorSavingDescription:
        'Ihre Einstellungen konnten nicht gespeichert werden.',
      displayNameLabel: 'Anzeigename',
      displayNameDescription:
        'Dieser Name erscheint in der Export-Vorschau und in der Excel-Datei. Leer lassen, um den Kontonamen zu verwenden.',
      displayNamePlaceholder: 'z.B. Max Mustermann',
      driverCompensationPercentLabel: 'Vergütung Fahrerzeit (%)',
      driverCompensationPercentDescription:
        'Prozentsatz der Fahrerzeit, der als vergütete Zeit angerechnet wird.',
      passengerCompensationPercentLabel: 'Vergütung Beifahrerzeit (%)',
      passengerCompensationPercentDescription:
        'Prozentsatz der Beifahrerzeit, der als vergütete Zeit angerechnet wird.',
      // Subscription Management
      subscriptionTitle: 'Abonnement',
      subscriptionDescription:
        'Verwalten Sie Ihr Abonnement und die Abrechnung.',
      subscriptionStatus: 'Status',
      nextBilling: 'Nächster Abrechnungstermin',
      manageBilling: 'Abrechnung verwalten',
      upgrade: 'Upgrade',
      noSubscription: 'Kein aktives Abonnement',
      getStarted: 'Jetzt starten',
      active: 'Aktiv',
      inactive: 'Inaktiv',
      // Team Management
      teamsTitle: 'Teams',
      teamsDescription: 'Verwalten Sie Ihre Teammitgliedschaften.',
      manageTeams: 'Teams verwalten',
      owner: 'Besitzer',
      member: 'Mitglied',
      errorPortalTitle: 'Portal-Fehler',
      errorPortalDescription:
        'Das Abrechnungsportal konnte nicht geöffnet werden. Bitte versuchen Sie es erneut.',
      noTeams: 'Sie sind noch nicht Teil eines Teams.',
      createFirstTeam: 'Erstes Team erstellen',
      createNewTeam: 'Neues Team erstellen',
      // New Settings Navigation
      preferences: 'Meine Einstellungen',
      preferencesDescription:
        'Persönliche Einstellungen und Anzeigepräferenzen',
      company: 'Firma',
      companyDescription: 'Firmeninformationen für Exporte',
      security: 'Sicherheit',
      securityDescription: 'Passwort- und Kontoverwaltung',
      manageTeam: 'Team verwalten',
      manageTeamDescription: 'Teammitgliedschaften und Berechtigungen',
      manageSubscription: 'Abonnement verwalten',
      manageSubscriptionDescription: 'Abrechnung und Abonnementeinstellungen',
      // Security Section
      changePassword: 'Passwort ändern',
      changePasswordDescription: 'Aktualisieren Sie Ihr Kontopasswort',
      deleteAccount: 'Konto löschen',
      deleteAccountDescription: 'Ihr Konto und alle Daten dauerhaft löschen',
      deleteAccountWarning:
        'Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Daten werden dauerhaft gelöscht.',
      // Form fields
      selectLanguage: 'Sprache auswählen',
      defaultStartTime: 'Standard-Startzeit',
      defaultStartTimeDescription: 'Standard-Startzeit für neue Einträge.',
      defaultEndTime: 'Standard-Endzeit',
      defaultEndTimeDescription: 'Standard-Endzeit für neue Einträge.',
      companyNamePlaceholder: 'Ihr Firmenname',
      companyEmailPlaceholder: 'kontakt@firma.com',
      companyEmailDescription: 'Kontakt-E-Mail für Ihre Firma.',
      companyPhone1Placeholder: '+49 123 456 789',
      companyPhone2Placeholder: '+49 123 456 790',
      companyFaxPlaceholder: '+49 123 456 791',
      compensationSettings: 'Vergütungseinstellungen',
      // Security page
      accountEmail: 'Konto-E-Mail',
      password: 'Passwort',
      passwordDescription: 'Ändern Sie Ihr Kontopasswort',
      twoFactorAuth: 'Zwei-Faktor-Authentifizierung',
      twoFactorAuthDescription:
        'Fügen Sie eine zusätzliche Sicherheitsebene zu Ihrem Konto hinzu',
      dangerZone: 'Gefahrenbereich',
      dangerZoneDescription: 'Unumkehrbare und zerstörerische Aktionen',
      signOutDescription: 'Von Ihrem Konto abmelden',
      deleteAccountConfirmTitle: 'Sind Sie sich absolut sicher?',
      deleteAccountConfirmDescription:
        'Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Daten werden dauerhaft gelöscht.',
      // Team page
      noTeamsDescription:
        'Sie sind noch nicht Teil eines Teams. Erstellen Sie Ihr erstes Team, um mit anderen zusammenzuarbeiten.',
      teamMembers: '{count} Mitglieder',
      manageAllTeams: 'Alle Teams verwalten',
      // Subscription page
      noSubscriptionDescription:
        'Upgraden Sie zu einem kostenpflichtigen Tarif, um alle Funktionen freizuschalten.',
      unknownPlan: 'Unbekannter Tarif',
      changePlan: 'Tarif ändern',
      trialing: 'Testphase',
      // Common
      saving: 'Wird gespeichert...',
      // Navigation
      backToTracker: 'Zurück zur Übersicht',
    },
    // Teams Page
    teams: {
      title: 'Team-Verwaltung',
      subtitle: 'Verwalten Sie Ihre Teams und Teammitglieder',
      createTeam: 'Team erstellen',
      noTeamsTitle: 'Noch keine Teams',
      noTeamsDescription:
        'Erstellen Sie Ihr erstes Team, um mit anderen zusammenzuarbeiten.',
      createFirstTeam: 'Erstes Team erstellen',
      yourTeams: 'Ihre Teams',
      owner: 'Besitzer',
      member: 'Mitglied',
      subscription: 'Abonnement',
      currentPeriod: 'Aktueller Zeitraum',
      licensedUsers: 'Lizenzierte Nutzer',
      manageBilling: 'Abrechnung verwalten',
      upgrade: 'Upgrade',
      noSubscription: 'Kein aktives Abonnement',
      getStarted: 'Jetzt starten',
      members: 'Mitglieder',
      joined: 'Beigetreten',
      inviteMember: 'Mitglied einladen',
      manage: 'Verwalten',
      errorLoadingTitle: 'Fehler beim Laden der Teams',
      errorLoadingDescription:
        'Ihre Teams konnten nicht geladen werden. Bitte versuchen Sie es erneut.',
      errorPortalTitle: 'Portal-Fehler',
      errorPortalDescription:
        'Das Abrechnungsportal konnte nicht geöffnet werden. Bitte versuchen Sie es erneut.',
      roles: {
        owner: 'Besitzer',
        admin: 'Administrator',
        member: 'Mitglied',
      },
    },
    // Pricing Page
    pricing: {
      title: 'Wählen Sie Ihren Tarif',
      subtitle:
        'Wählen Sie den perfekten Tarif für Ihre Zeiterfassungsbedürfnisse',
      loadingPlans: 'Tarife werden geladen...',
      monthly: 'Monatlich',
      yearly: 'Jährlich',
      save20: '20% sparen',
      perUserPerMonth: 'pro Nutzer pro Monat',
      month: 'Monat',
      year: 'Jahr',
      upTo: 'Bis zu',
      users: 'Nutzer',
      mostPopular: 'Am beliebtesten',
      getStarted: 'Jetzt starten',
      createTeam: 'Team erstellen',
      processing: 'Wird verarbeitet...',
      faqTitle: 'Häufig gestellte Fragen',
      faq1Question: 'Kann ich jederzeit kündigen?',
      faq1Answer:
        'Ja, Sie können Ihr Abonnement jederzeit kündigen. Sie haben weiterhin Zugang bis zum Ende Ihres Abrechnungszeitraums.',
      faq2Question: 'Welche Zahlungsmethoden akzeptieren Sie?',
      faq2Answer:
        'Wir akzeptieren alle gängigen Kredit- und Debitkarten über unseren sicheren Zahlungsabwickler.',
      faq3Question: 'Gibt es eine kostenlose Testphase?',
      faq3Answer:
        'Ja, wir bieten eine 14-tägige kostenlose Testphase für alle Tarife. Keine Kreditkarte erforderlich.',
      faq4Question: 'Kann ich später den Tarif wechseln?',
      faq4Answer:
        'Absolut! Sie können Ihren Tarif jederzeit in Ihren Kontoeinstellungen upgraden oder downgraden.',
      loginRequiredTitle: 'Anmeldung erforderlich',
      loginRequiredDescription:
        'Bitte melden Sie sich an, um einen Tarif zu abonnieren.',
      errorTitle: 'Zahlungsfehler',
      errorDescription:
        'Bei der Verarbeitung Ihrer Zahlung ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
    },
    // Export Page
    export_page: {
      backButton: 'Zurück zur Übersicht',
    },
    // Export Preview Component
    export_preview: {
      exportButton: 'Nach Excel exportieren',
      exportPdfButton: 'PDF herunterladen',
      timesheetTitle: 'Stundenzettel für den Monat: {month}',
      headerCompany: 'Name und Telefon / Funk:',
      headerWeek: 'Woche',
      headerDate: 'Datum',
      headerLocation: 'Einsatzort',
      headerWorkTime: 'tatsächliche Arbeitszeit',
      headerPauseDuration: 'abzgl. Pause',
      headerDriverTime: 'zzgl. FZ als Fahrer',
      headerPassengerTime: 'FZ als Beifahrer',
      headerCompensatedTime: 'gesamt AZ',
      headerFrom: 'von',
      headerTo: 'bis',
      footerTotalPerWeek: 'Gesamt pro Woche:',
      footerTotalHours: 'Stunden insgesamt:',
      footerTotalAfterConversion: 'Gesamtstd. nach Umr.:',
      driverMark: 'F',
      locationNotFound: 'Ort nicht gefunden',
      headerMileage: 'km eig. PKW/Verpfl.',
      signatureLine: 'Unterschrift:',
      noDataHint: 'Keine Daten für den Export in diesem Monat verfügbar.',
      noDataTitle: 'Keine Daten zum Exportieren',
      noDataDescription:
        'Für den ausgewählten Monat sind keine Einträge vorhanden. Bitte fügen Sie Einträge hinzu, bevor Sie exportieren.',
    },
    // Bottom Navigation
    bottomNav: {
      home: 'Übersicht',
      export: 'Vorschau & Export',
      settings: 'Einstellungen',
      signOut: 'Abmelden',
    },
    topNav: {
      features: 'Funktionen',
      pricing: 'Preise',
      login: 'Anmelden',
    },
    // Landing Page
    landing: {
      heroTitle: 'Mühelose Zeiterfassung für Ihr Unternehmen',
      heroDescription:
        'TimeWise Tracker hilft Ihnen und Ihrem Team, Arbeitszeiten nahtlos zu verwalten. Von der Live-Erfassung bis zu detaillierten Exporten – wir haben alles, was Sie brauchen.',
      getStarted: 'Jetzt starten',
      learnMore: 'Mehr erfahren',
      features: {
        keyFeatures: 'Hauptfunktionen',
        headerTag: 'Zeiterfassung, aber schlauer',
        headerTitle: 'Alles, was Sie brauchen – nichts Überflüssiges.',
        headerDescription:
          'TimeWise Tracker ist vollgepackt mit Funktionen, die Ihre Zeiterfassung so einfach und effizient wie möglich machen.',
        list: [
          {
            title: 'Live-Zeiterfassung',
            desc: 'Starten und stoppen Sie einen Timer mit nur einem Klick. Ihre Arbeitszeit wird genau und ohne manuelle Berechnung erfasst.',
          },
          {
            title: 'Manuelle & spezielle Einträge',
            desc: 'Fügen Sie ganz einfach Einträge für vergangene Arbeiten hinzu oder erfassen Sie Kranktage, Urlaub und Feiertage mit speziellen Eintragstypen.',
          },
          {
            title: 'Standort & Reisen',
            desc: 'Ermitteln Sie Ihren aktuellen Standort automatisch oder geben Sie ihn manuell ein. Erfassen Sie Reisezeiten und Fahrerstatus für eine genaue Vergütung.',
          },
          {
            title: 'Nahtloser Export',
            desc: 'Erstellen Sie professionell aussehende Stundenzettel im Excel- und PDF-Format, bereit zum Versand für die Lohnabrechnung oder zur Ablage.',
          },
          {
            title: 'Intelligente Vorschläge',
            desc: 'Die App lernt Ihre Gewohnheiten und schlägt basierend auf früheren Einträgen Orte und Zeiten vor, um Ihren Workflow zu beschleunigen.',
          },
          {
            title: 'Automatische Pausenberechnung',
            desc: 'Basierend auf Ihrer Arbeitszeit schlägt die App die gesetzlich vorgeschriebene Pause vor, die Sie mit einem Klick übernehmen können.',
          },
        ],
      },
      pricing: {
        headerTitle: 'Einfache, transparente Preise',
        headerDescription:
          'Ein Tarif, der alles enthält, was Sie brauchen. Keine Stufen, keine Zusatzpakete, keine Überraschungen.',
        planTitle: 'Pro-Tarif',
        planDescription:
          'Alles, was Sie für eine präzise Zeiterfassung, Berichte und Organisation für sich und Ihr Team benötigen.',
        whatsIncluded: 'Das ist enthalten',
        includedFeatures: [
          'Live-Zeiterfassung',
          'Manuelle Zeiteinträge',
          'Spezielle Einträge (Krank, Urlaub, etc.)',
          'Standort- & Reisezeiterfassung',
          'Excel- & PDF-Exporte',
          'Mehrsprachigkeit (DE/EN)',
          'Unbegrenzte Einträge',
          'Sichere Cloud-Speicherung',
        ],
        payPerUser: 'Preis pro Nutzer und Monat',
        price: '10€',
        priceCurrency: 'EUR',
        getAccess: 'Zugang erhalten',
        footnote:
          'Rechnungen und Quittungen für eine einfache Firmenabrechnung verfügbar.',
      },
      faqTitle: 'Häufig gestellte Fragen',
      faqs: [
        {
          question: 'Gibt es eine kostenlose Testphase?',
          answer:
            'Ja, Sie können sich anmelden und TimeWise Tracker mit allen Funktionen 14 Tage lang kostenlos nutzen. Es ist keine Kreditkarte erforderlich.',
        },
        {
          question:
            'Kann ich Zeiten für mehrere Projekte oder Kunden erfassen?',
          answer:
            'Auf jeden Fall. Das Feld "Einsatzort" kann für verschiedene Projekte, Kunden oder Aufgaben genutzt werden. Zukünftige Funktionen werden ein eigenes Projekt- und Kundenmanagement bieten.',
        },
        {
          question: 'Wie funktioniert der Excel- und PDF-Export?',
          answer:
            'Auf der Seite "Vorschau & Export" können Sie jeden Monat auswählen und einen professionell formatierten Stundenzettel herunterladen. Die Excel-Datei ist für Berechnungen geeignet, das PDF perfekt zum Ausdrucken und Unterschreiben.',
        },
        {
          question: 'Sind meine Daten sicher?',
          answer:
            'Ja, Ihre Daten werden sicher mit Firebase, einer Plattform von Google, gespeichert. Wir verwenden branchenübliche Sicherheitsstandards, um Ihre Informationen zu schützen.',
        },
      ],
      footer: {
        copyright: '© 2025 TimeWise Tracker. Alle Rechte vorbehalten.',
        terms: 'Nutzungsbedingungen',
        privacy: 'Datenschutz',
        imprint: 'Impressum',
        cookiePolicy: 'Cookie-Richtlinie',
      },
    },
    // Subscription Guard
    subscription: {
      checking: 'Abonnement wird überprüft...',
      loginRequiredTitle: 'Anmeldung erforderlich',
      loginRequiredDescription:
        'Bitte melden Sie sich an, um auf diese Funktion zuzugreifen.',
      loginButton: 'Anmelden',
      requiredTitle: 'Abonnement erforderlich',
      requiredDescription:
        'Sie benötigen ein aktives Abonnement, um auf diese Funktion zuzugreifen.',
      choosePlanButton: 'Tarif wählen',
      manageSubscriptionButton: 'Abonnement verwalten',
    },
  },
}

export type Dictionary = typeof dictionaries.en

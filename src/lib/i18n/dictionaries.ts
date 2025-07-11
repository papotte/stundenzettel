export const dictionaries = {
  en: {
    // Login Page
    login: {
      title: 'TimeWise Tracker',
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
      headerTravelTime: 'Travel Time',
      headerCompensatedTime: 'Compensated Hours',
      headerDriver: 'Driver',
      headerFrom: 'From',
      headerTo: 'To',
      footerTotalPerWeek: 'Total per week:',
      footerTotalHours: 'Total hours:',
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
  },
  de: {
    // Login Page
    login: {
      title: 'TimeWise Tracker',
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
      pauseLabel: 'Pause',
      pauseDurationLabel: 'Pausendauer (HH:mm)',
      pauseDurationDescription:
        'Geben Sie die Gesamtdauer Ihrer Pause im Format HH:mm ein (z.B. {example} für 30 Minuten).',
      pauseDurationInvalid:
        'Bitte geben Sie eine gültige Dauer im Format HH:mm ein (z.B. {example}).',
      travelLabel: '{hours} Std. Fahrt',
      driverLabel: 'Fahrer',
      runningLabel: 'Jetzt',
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
      headerTravelTime: 'zzgl. Fahrtzeit',
      headerCompensatedTime: 'vergütete AZ',
      headerDriver: 'Fahrer',
      headerFrom: 'von',
      headerTo: 'bis',
      footerTotalPerWeek: 'Gesamt pro Woche:',
      footerTotalHours: 'Stunden insgesamt:',
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
  },
}

export type Dictionary = typeof dictionaries.en

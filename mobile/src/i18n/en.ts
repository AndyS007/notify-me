export const en = {
  auth: {
    signIn: {
      title: 'Welcome back',
      emailPlaceholder: 'Email',
      passwordPlaceholder: 'Password',
      signingIn: 'Signing in\u2026',
      signIn: 'Sign in',
      or: 'or',
      continueWithGoogle: 'Continue with Google',
      continueWithApple: ' Continue with Apple',
      noAccount: "Don't have an account? ",
      signUpLink: 'Sign up',
      errorTitle: 'Sign in failed',
      appleErrorTitle: 'Apple sign-in failed',
      googleErrorTitle: 'Google sign-in failed',
    },
    signUp: {
      title: 'Create account',
      emailPlaceholder: 'Email',
      passwordPlaceholder: 'Password',
      creatingAccount: 'Creating account\u2026',
      signUp: 'Sign up',
      or: 'or',
      continueWithGoogle: 'Continue with Google',
      continueWithApple: ' Continue with Apple',
      alreadyHaveAccount: 'Already have an account? ',
      signInLink: 'Sign in',
      errorTitle: 'Sign up failed',
      sendCodeErrorTitle: 'Failed to send verification code',
      appleErrorTitle: 'Apple sign-in failed',
      googleErrorTitle: 'Google sign-in failed',
    },
    verifyEmail: {
      title: 'Verify email',
      instruction: (email: string) => `Enter the code sent to ${email}`,
      codePlaceholder: 'Verification code',
      verifying: 'Verifying\u2026',
      verify: 'Verify',
      errorTitle: 'Verification failed',
    },
  },
  home: {
    title: 'Notifications',
    appCount: (count: number) => `${count} apps`,
    signOut: 'Sign out',
  },
  notifications: {
    empty: {
      icon: '\uD83D\uDD14',
      title: 'No notifications yet',
      subtitle: 'Notifications will appear here once your device receives them.',
    },
    noContent: '(no content)',
  },
  permission: {
    title: 'Notification access required',
    description:
      'Grant notification listener access so this app can track incoming notifications.',
    grantAccess: 'Grant Access',
  },
  time: {
    justNow: 'just now',
    minutesAgo: (min: number) => `${min}m ago`,
    hoursAgo: (hr: number) => `${hr}h ago`,
    daysAgo: (day: number) => `${day}d ago`,
  },
  update: {
    title: 'Update Available',
    message: 'A new version is ready. Install now for the latest improvements.',
    later: 'Later',
    installNow: 'Install Now',
    errorTitle: 'Update Failed',
    errorMessage: 'Could not download the update. Please try again later.',
  },
};

export type Translations = typeof en;

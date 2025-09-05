import { createContext, ReactNode, useContext, useState } from 'react';

interface OnboardingContextType {
  stepIndex: number;
  totalSteps: number;
  canGoBack: boolean;
  setStepIndex: (index: number) => void;
  setCanGoBack: (canGoBack: boolean) => void;
  onBack?: () => void;
  setOnBack: (onBack: () => void) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [onBack, setOnBack] = useState<(() => void) | undefined>(undefined);
  const totalSteps = 7;

  return (
    <OnboardingContext.Provider value={{
      stepIndex,
      totalSteps,
      canGoBack,
      setStepIndex,
      setCanGoBack,
      onBack,
      setOnBack,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
} 
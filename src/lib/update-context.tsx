import { createContext, useContext, ReactNode } from 'react';
import { useUpdateChecker, UpdateState } from '@/hooks/use-update-checker';

const UpdateContext = createContext<UpdateState | null>(null);

interface UpdateProviderProps {
    children: ReactNode;
}

/**
 * Provider that shares update state across the entire application
 * This prevents multiple components from making redundant update checks
 */
export function UpdateProvider({ children }: UpdateProviderProps) {
    const updateState = useUpdateChecker();

    return (
        <UpdateContext.Provider value={updateState}>
            {children}
        </UpdateContext.Provider>
    );
}

/**
 * Hook to access the shared update state
 * Must be used within an UpdateProvider
 */
export function useUpdate(): UpdateState {
    const context = useContext(UpdateContext);

    if (!context) {
        throw new Error('useUpdate must be used within an UpdateProvider');
    }

    return context;
}

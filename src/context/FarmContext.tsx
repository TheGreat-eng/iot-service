import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getFarms } from '../api/farmService';
import { isAuthenticated } from '../utils/auth'; // ✅ THÊM

interface FarmContextType {
    farmId: number | null;
    setFarmId: (id: number) => void;
    isLoadingFarm: boolean;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [farmId, setFarmId] = useState<number | null>(() => {
        const saved = localStorage.getItem('selectedFarmId');
        return saved ? parseInt(saved, 10) : null;
    });
    const [isLoadingFarm, setIsLoadingFarm] = useState(true);

    useEffect(() => {
        const autoSelectFarm = async () => {
            // ✅ CHỈ fetch nếu đã authenticated
            if (!isAuthenticated()) {
                console.log('⏸️ Not authenticated, skipping farm fetch');
                setIsLoadingFarm(false);
                return;
            }

            if (farmId === null) {
                try {
                    const response = await getFarms();
                    const farmList = response.data.data || response.data;
                    if (Array.isArray(farmList) && farmList.length > 0) {
                        setFarmId(farmList[0].id);
                        console.log('✅ Auto-selected farm:', farmList[0].name);
                    }
                } catch (error) {
                    console.error('❌ Failed to auto-select farm:', error);
                } finally {
                    setIsLoadingFarm(false);
                }
            } else {
                setIsLoadingFarm(false);
            }
        };

        autoSelectFarm();
    }, []); // ✅ Empty deps, chỉ chạy 1 lần

    useEffect(() => {
        if (farmId !== null) {
            localStorage.setItem('selectedFarmId', farmId.toString());
        } else {
            localStorage.removeItem('selectedFarmId');
        }
    }, [farmId]);

    return (
        <FarmContext.Provider value={{ farmId, setFarmId, isLoadingFarm }}>
            {children}
        </FarmContext.Provider>
    );
};

export const useFarm = () => {
    const context = useContext(FarmContext);
    if (!context) {
        throw new Error('useFarm must be used within FarmProvider');
    }
    return context;
};
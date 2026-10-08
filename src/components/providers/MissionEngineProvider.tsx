'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { JarvisCore } from '@/core/kernel/JarvisCore';
import { EventPipeline } from '@/core/messaging/EventPipeline';
import { SystemEvent } from '@/core/interfaces';

import { IntentEngine } from '@/core/engines/IntentEngine';
import { MissionPlanner } from '@/core/engines/MissionPlanner';
import { MissionScheduler } from '@/core/engines/MissionScheduler';
import { DecisionEngine } from '@/core/engines/DecisionEngine';
import { WorkforceManager } from '@/core/engines/WorkforceManager';
import { DepartmentRuntime } from '@/core/runtime/DepartmentRuntime';
import { CompanyStateEngine } from '@/core/engines/CompanyStateEngine';
import { ExecutiveEngine } from '@/core/engines/ExecutiveEngine';
import { PersistenceEngine } from '@/core/engines/PersistenceEngine';

interface MissionEngineContextType {
  jarvis: JarvisCore | null;
  pipeline: EventPipeline | null;
  events: SystemEvent[];
  companyState: any;
  dispatchCommand: (objective: string) => Promise<string>;
}

const MissionEngineContext = createContext<MissionEngineContextType>({
  jarvis: null,
  pipeline: null,
  events: [],
  companyState: {},
  dispatchCommand: async () => ''
});

export const useMissionEngine = () => useContext(MissionEngineContext);

export function MissionEngineProvider({ children }: { children: React.ReactNode }) {
  const [jarvis, setJarvis] = useState<JarvisCore | null>(null);
  const [pipeline, setPipeline] = useState<EventPipeline | null>(null);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [companyState, setCompanyState] = useState<any>({});
  
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initOS = async () => {
      const core = JarvisCore.getInstance();
      const pipe = EventPipeline.getInstance();

      // Register Tier 1 Engines
      core.registerEngine(new IntentEngine());
      core.registerEngine(new MissionPlanner());
      core.registerEngine(new MissionScheduler());
      core.registerEngine(new DecisionEngine());
      core.registerEngine(new WorkforceManager());
      core.registerEngine(new DepartmentRuntime('Marketing'));
      core.registerEngine(new DepartmentRuntime('Finance'));
      core.registerEngine(new DepartmentRuntime('Creative'));
      core.registerEngine(new DepartmentRuntime('Sales'));
      core.registerEngine(new DepartmentRuntime('Legal'));
      core.registerEngine(new DepartmentRuntime('Operations'));
      
      const stateEngine = new CompanyStateEngine();
      core.registerEngine(stateEngine);
      core.registerEngine(new ExecutiveEngine());
      core.registerEngine(new PersistenceEngine());

      await core.boot();

      setJarvis(core);
      setPipeline(pipe);
      setCompanyState({...stateEngine.state});

      // Subscribe React state to event pipeline
      const unsubscribe = pipe.subscribe('*', (event) => {
        setEvents(prev => [...prev, event]);
        // Update company state on UI
        setCompanyState({...stateEngine.state});
      });
      
      return unsubscribe;
    };

    const cleanup = initOS();
    
    return () => {
      cleanup.then(unsub => {
        if (unsub) unsub();
      });
    };
  }, []);

  const dispatchCommand = async (objective: string) => {
    if (!jarvis) return '';
    return jarvis.dispatchCommand(objective);
  };

  return (
    <MissionEngineContext.Provider value={{ jarvis, pipeline, events, companyState, dispatchCommand }}>
      {children}
    </MissionEngineContext.Provider>
  );
}

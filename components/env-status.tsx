"use client";

import { isDemoMode, hasSupabaseVars } from "@/lib/demo-data";
import { InfoIcon, AlertTriangle, CheckCircle2 } from "lucide-react";

export function EnvStatus() {
  const demoMode = isDemoMode();
  const hasSupabase = hasSupabaseVars();

  return (
    <div className="w-full mb-6">
      <div className={`text-sm p-3 px-5 rounded-md flex gap-3 items-center ${
        demoMode 
          ? 'bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-100' 
          : 'bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100'
      }`}>
        {demoMode ? (
          <AlertTriangle size="16" strokeWidth={2} className="flex-shrink-0" />
        ) : (
          <CheckCircle2 size="16" strokeWidth={2} className="flex-shrink-0" />
        )}
        <div className="flex-1">
          {demoMode ? (
            <div>
              <strong>🎮 Demo Mode Active</strong> - Using mock data. 
              {!hasSupabase && " Supabase credentials not configured."}
              {" "}Add Supabase credentials to your <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">.env.local</code> file for live data.
            </div>
          ) : (
            <div>
              <strong>✅ Supabase Connected</strong> - Using live database
            </div>
          )}
        </div>
      </div>
      
      <details className="mt-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">Environment Status Details</summary>
        <div className="mt-2 p-3 bg-muted rounded space-y-1">
          <div className="flex items-center gap-2">
            {hasSupabase ? <CheckCircle2 size="12" /> : <InfoIcon size="12" />}
            <span>Supabase URL: {hasSupabase ? 'Configured' : 'Not configured'}</span>
          </div>
          <div className="flex items-center gap-2">
            {hasSupabase ? <CheckCircle2 size="12" /> : <InfoIcon size="12" />}
            <span>Supabase Key: {hasSupabase ? 'Configured' : 'Not configured'}</span>
          </div>
          <div className="flex items-center gap-2">
            {demoMode ? <AlertTriangle size="12" /> : <InfoIcon size="12" />}
            <span>Demo Mode: {demoMode ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>
      </details>
    </div>
  );
}

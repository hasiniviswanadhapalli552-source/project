import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <p className="text-slate-500 mt-3 text-sm">{label}</p>
    </div>
  );
}

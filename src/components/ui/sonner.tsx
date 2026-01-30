import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-right"
      offset={20}
      gap={12}
      duration={4000}
      visibleToasts={4}
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-white border border-slate-200 shadow-lg shadow-black/5 rounded-xl px-4 py-3 w-[380px] flex items-start gap-3",
          title: "text-[15px] font-semibold text-slate-800",
          description: "text-[13px] text-slate-500 mt-0.5",
          actionButton: "bg-emerald-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-700",
          cancelButton: "bg-slate-100 text-slate-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-slate-200",
          closeButton: "bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg",
          success: "border-emerald-100",
          error: "border-red-100",
          warning: "border-amber-100",
          info: "border-blue-100",
        },
      }}
      icons={{
        success: (
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ),
        error: (
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        ),
        warning: (
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        ),
        info: (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        ),
      }}
      {...props}
    />
  );
};

export { Toaster, toast };

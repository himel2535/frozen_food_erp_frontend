'use client';

import { useCallback, useEffect, useState } from 'react';

export function useReportPrint<T extends string = string>() {
  const [printTarget, setPrintTarget] = useState<T | null>(null);

  const printSection = useCallback(async (sectionId: T) => {
    setPrintTarget(sectionId);
    document.body.classList.add('print-report-active');
    document.body.dataset.printTarget = sectionId;

    try {
      await document.fonts.ready;
    } catch {
      /* fonts API unavailable */
    }

    await new Promise((resolve) => window.setTimeout(resolve, 250));
    window.print();
  }, []);

  useEffect(() => {
    const onAfterPrint = () => {
      document.body.classList.remove('print-report-active');
      delete document.body.dataset.printTarget;
      setPrintTarget(null);
    };

    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('afterprint', onAfterPrint);
      document.body.classList.remove('print-report-active');
      delete document.body.dataset.printTarget;
    };
  }, []);

  return { printSection, printTarget };
}

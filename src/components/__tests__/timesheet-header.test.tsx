import React from 'react';
import { render, screen } from '@testing-library/react';
import TimesheetHeader from '../timesheet-header';
import type { UserSettings } from '@/lib/types';

describe('TimesheetHeader', () => {
  const mockT = (key: string) => key;

  it('renders nothing when user settings are not provided', () => {
    const { container } = render(<TimesheetHeader userSettings={null} t={mockT} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders company name and details when provided', () => {
    const userSettings: UserSettings = {
      companyName: 'Test Corp',
      companyEmail: 'test@corp.com',
      companyPhone1: '123-456',
      companyPhone2: '789-012',
      companyFax: '345-678',
      defaultWorkHours: 8,
      defaultStartTime: '09:00',
      defaultEndTime: '17:00',
      language: 'en',
    };

    render(<TimesheetHeader userSettings={userSettings} t={mockT} />);
    
    expect(screen.getByText('export_preview.headerCompany')).toBeInTheDocument();
    const details = screen.getByText(/Test Corp test@corp.com/);
    expect(details).toHaveTextContent('Tel.: 123-456 / 789-012');
    expect(details).toHaveTextContent('FAX: 345-678');
  });

  it('handles partial user settings gracefully', () => {
    const userSettings: UserSettings = {
      companyName: 'Partial Inc.',
      defaultWorkHours: 8,
      defaultStartTime: '09:00',
      defaultEndTime: '17:00',
      language: 'en',
      companyEmail: '',
      companyPhone1: '',
      companyPhone2: '',
      companyFax: '',
    };

    render(<TimesheetHeader userSettings={userSettings} t={mockT} />);

    expect(screen.getByText('export_preview.headerCompany')).toBeInTheDocument();
    expect(screen.getByText('Partial Inc.')).toBeInTheDocument();
    expect(screen.queryByText(/Tel.:/)).not.toBeInTheDocument();
  });
});

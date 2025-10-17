import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Calculator from '@/components/calculators/Calculator';
import { CalculatorConfig } from '@/types/calculators';

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="chart">Chart</div>,
  Bar: () => <div data-testid="chart">Chart</div>,
  Pie: () => <div data-testid="chart">Chart</div>,
  Doughnut: () => <div data-testid="chart">Chart</div>
}));

jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn()
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  BarElement: {},
  ArcElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  Filler: {}
}));

const mockCalculatorConfig: CalculatorConfig = {
  id: 'test-calculator',
  name: 'Test Calculator',
  description: 'A test calculator',
  category: 'investment',
  inputs: [
    {
      id: 'amount',
      label: 'Amount',
      type: 'currency',
      value: 0,
      required: true,
      min: 1000
    },
    {
      id: 'rate',
      label: 'Interest Rate',
      type: 'percentage',
      value: 0,
      required: true,
      min: 0,
      max: 50
    },
    {
      id: 'years',
      label: 'Years',
      type: 'number',
      value: 0,
      required: true,
      min: 1,
      max: 50
    }
  ],
  calculate: (inputs) => [
    {
      id: 'total',
      label: 'Total Amount',
      value: inputs.amount * Math.pow(1 + inputs.rate / 100, inputs.years),
      formattedValue: `₹${(inputs.amount * Math.pow(1 + inputs.rate / 100, inputs.years)).toLocaleString('en-IN')}`,
      type: 'currency'
    }
  ],
  generateChart: (inputs, results) => ({
    type: 'line',
    data: {
      labels: ['Year 1', 'Year 2', 'Year 3'],
      datasets: [{
        label: 'Growth',
        data: [inputs.amount, inputs.amount * 1.1, results[0].value],
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 1)'
      }]
    }
  }),
  examples: [
    {
      name: 'Example 1',
      description: 'Basic example',
      inputs: { amount: 100000, rate: 10, years: 5 }
    }
  ]
};

describe('Calculator Component', () => {
  it('renders calculator with inputs and controls', () => {
    render(<Calculator config={mockCalculatorConfig} />);
    
    expect(screen.getByText('Test Calculator')).toBeInTheDocument();
    expect(screen.getByText('A test calculator')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount *')).toBeInTheDocument();
    expect(screen.getByLabelText('Interest Rate *')).toBeInTheDocument();
    expect(screen.getByLabelText('Years *')).toBeInTheDocument();
    expect(screen.getByText('Calculate')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('shows examples when provided', () => {
    render(<Calculator config={mockCalculatorConfig} showExamples={true} />);
    
    expect(screen.getByText('Examples')).toBeInTheDocument();
    expect(screen.getByText('Example 1')).toBeInTheDocument();
  });

  it('validates required inputs', async () => {
    render(<Calculator config={mockCalculatorConfig} />);
    
    const calculateButton = screen.getByText('Calculate');
    fireEvent.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Amount is required')).toBeInTheDocument();
    });
  });

  it('validates minimum values', async () => {
    render(<Calculator config={mockCalculatorConfig} />);
    
    const amountInput = screen.getByLabelText('Amount *');
    fireEvent.change(amountInput, { target: { value: '500' } });
    
    const calculateButton = screen.getByText('Calculate');
    fireEvent.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Amount must be at least 1000')).toBeInTheDocument();
    });
  });

  it('performs calculation and shows results', async () => {
    const onCalculate = jest.fn();
    render(<Calculator config={mockCalculatorConfig} onCalculate={onCalculate} />);
    
    // Fill in inputs
    fireEvent.change(screen.getByLabelText('Amount *'), { target: { value: '100000' } });
    fireEvent.change(screen.getByLabelText('Interest Rate *'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Years *'), { target: { value: '5' } });
    
    // Calculate
    fireEvent.click(screen.getByText('Calculate'));
    
    await waitFor(() => {
      expect(screen.getByText('Results')).toBeInTheDocument();
      expect(screen.getByText('Total Amount')).toBeInTheDocument();
      expect(onCalculate).toHaveBeenCalled();
    });
  });

  it('shows chart when results are available', async () => {
    render(<Calculator config={mockCalculatorConfig} showChart={true} />);
    
    // Fill in inputs and calculate
    fireEvent.change(screen.getByLabelText('Amount *'), { target: { value: '100000' } });
    fireEvent.change(screen.getByLabelText('Interest Rate *'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Years *'), { target: { value: '5' } });
    fireEvent.click(screen.getByText('Calculate'));
    
    await waitFor(() => {
      expect(screen.getByTestId('chart')).toBeInTheDocument();
    });
  });

  it('loads example data when example is clicked', () => {
    render(<Calculator config={mockCalculatorConfig} showExamples={true} />);
    
    fireEvent.click(screen.getByText('Example 1'));
    
    expect(screen.getByDisplayValue('100000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('resets calculator when reset button is clicked', () => {
    render(<Calculator config={mockCalculatorConfig} />);
    
    // Fill in some data
    fireEvent.change(screen.getByLabelText('Amount *'), { target: { value: '50000' } });
    fireEvent.change(screen.getByLabelText('Interest Rate *'), { target: { value: '8' } });
    
    // Reset
    fireEvent.click(screen.getByText('Reset'));
    
    expect(screen.getByLabelText('Amount *')).toHaveValue(0);
    expect(screen.getByLabelText('Interest Rate *')).toHaveValue(0);
  });

  it('shows save button after calculation', async () => {
    render(<Calculator config={mockCalculatorConfig} />);
    
    // Fill in inputs and calculate
    fireEvent.change(screen.getByLabelText('Amount *'), { target: { value: '100000' } });
    fireEvent.change(screen.getByLabelText('Interest Rate *'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Years *'), { target: { value: '5' } });
    fireEvent.click(screen.getByText('Calculate'));
    
    await waitFor(() => {
      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });

  it('opens save dialog when save button is clicked', async () => {
    render(<Calculator config={mockCalculatorConfig} />);
    
    // Calculate first
    fireEvent.change(screen.getByLabelText('Amount *'), { target: { value: '100000' } });
    fireEvent.change(screen.getByLabelText('Interest Rate *'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Years *'), { target: { value: '5' } });
    fireEvent.click(screen.getByText('Calculate'));
    
    await waitFor(() => {
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
    });
    
    expect(screen.getByText('Save Calculation')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter a name for this calculation')).toBeInTheDocument();
  });
});
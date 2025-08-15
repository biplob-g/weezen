import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserInfoForm from "@/components/chatbot/UserInfoForm";

describe("UserInfoForm", () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it("renders form fields correctly", () => {
    render(<UserInfoForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start chat/i })
    ).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();
    render(<UserInfoForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole("button", { name: /start chat/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();
    render(<UserInfoForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/full name/i), "John Doe");
    await user.type(
      screen.getByLabelText(/email address/i),
      "john@example.com"
    );
    await user.type(screen.getByLabelText(/phone number/i), "1234567890");

    const submitButton = screen.getByRole("button", { name: /start chat/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@example.com",
        phone: "1234567890",
        countryCode: "+1",
      });
    });
  });

  it("shows loading state when submitting", async () => {
    const user = userEvent.setup();
    render(<UserInfoForm onSubmit={mockOnSubmit} isLoading={true} />);

    expect(
      screen.getByRole("button", { name: /starting chat/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /starting chat/i })
    ).toBeDisabled();
  });

  it("uses default country code", () => {
    render(<UserInfoForm onSubmit={mockOnSubmit} defaultCountryCode="+44" />);

    expect(screen.getByText("🇬🇧 +44")).toBeInTheDocument();
  });
});

import React from "react";
import { FieldErrors, FieldValues, UseFormRegister } from "react-hook-form";
import QuestionsForm from "./QuestionsForm";

type Props = {
  questions: {
    id: string;
    question: string;
    answered: string | null;
  }[];
  type: "Appointment" | "Payment";
  register: UseFormRegister<FieldValues>;
  error: FieldErrors<FieldValues>;
  onNext(): void;
  step: number;
  date: Date | undefined;
  onBooking: React.Dispatch<React.SetStateAction<Date | undefined>>;
  onBack(): void;
  onSlot(slot: string): void;
  slot?: string;
  loading: boolean;
  bookings?:
    | {
        date: Date;
        slot: string;
      }[]
    | undefined;
  products?:
    | {
        name: string;
        image: string;
        price: string;
      }[]
    | undefined;
  amount?: number;
  stripedId?: string;
};

const PortalSteps = ({
  questions,
  type,
  register,
  error,
  onNext,
  step,
  date,
  onBooking,
  onBack,
  onSlot,
  slot,
  loading,
  bookings,
  products,
  amount,
  stripedId,
}: Props) => {
  if (step == 1) {
    return (
      <QuestionsForm
        register={register}
        error={error}
        onNext={onNext}
        questions={questions}
      />
    );
  }

  // if (step == 2 && type == "Appointment") {
  //   return (
  //     <BookAppointmentDate
  //       date={date}
  //       bookings={bookings}
  //       currentSlot={slot}
  //       register={register}
  //       onBack={onBack}
  //       onBooking={onBooking}
  //       onSlot={onSlot}
  //       loading={loading}
  //     />
  //   );
  // }

  // if (step == 2 && type == "Payment") {
  //   return (
  //     <PaymentCheckout
  //       products={products}
  //       stripe={stripedId}
  //       onBack={onBack}
  //       onNext={onNext}
  //       amount={amount}
  //     />
  //   );
  // }
  return <div>PortalSteps</div>;
};

export default PortalSteps;

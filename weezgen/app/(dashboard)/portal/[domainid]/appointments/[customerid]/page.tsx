import {
  onDomainCustomerResponses,
  onGetAllDomainBookings,
} from "@/actions/appointments";
import PortalForm from "@/components/forms/portal/portalForm";
import React from "react";

type Props = {
  params: { domainid: string; customerid: string };
};

const CustomerSignUpForm = async ({ params }: Props) => {
  const questions = await onDomainCustomerResponses(params.customerid);
  const bookings = await onGetAllDomainBookings(params.domainid);
  if (!questions) return null;

  return (
    <PortalForm
      bookings={bookings}
      email={questions.email!}
      domainid={params.domainid}
      customerId={questions.questions}
      type="Appointment"
    />
  );
};

export default CustomerSignUpForm;

"use client";

import { useHelpDesk } from "@/hooks/settings/useSettings";
import React from "react";
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card";
import Section from "../SectionLabel";
import FormGenerator from "../forms/SignUp/formGenerator";
import { Button } from "../ui/button";
import { Loader } from "../loader";
import Accordion from "../accordion";
// import { Separator } from "../ui/separator";

type Props = {
  id: string;
};

const HelpDesk = ({ id }: Props) => {
  const { isQuestions, register, errors, onSubmitQuestion, loading } =
    useHelpDesk(id);

  return (
    <Card className="w-full grid grid-cols-1 lg:grid-cols-2">
      <CardContent className="p-6">
        <CardTitle>Help Desk</CardTitle>
        <form onSubmit={onSubmitQuestion} className="flex flex-col gap-6 mt-6">
          <div className="flex flex-col gap-3">
            <Section
              label="Question"
              message="Add a question that you believe is frequently asked."
            />
            <FormGenerator
              inputType="input"
              register={register as any}
              errors={errors}
              form="help-desk-form"
              name="question"
              placeholder="Type your question"
              type="text"
            />
          </div>

          <div className="flex flex-col gap-3">
            <Section
              label="Answer"
              message="Provide the answer to this frequently asked question."
            />
            <FormGenerator
              inputType="textarea"
              register={register as any}
              errors={errors}
              form="help-desk-form"
              name="answer"
              placeholder="Type your answer"
              type="text"
              lines={5}
            />
          </div>

          <Button
            type="submit"
            className="bg-primary hover:bg-primary cursor-pointer hover:backdrop-opacity-70 transition duration-150 ease-in-out text-white font-semibold"
          >
            Create
          </Button>
        </form>
      </CardContent>

      <CardContent className="p-5 overflow-y-auto chat-window">
        <Loader loading={loading}>
          {isQuestions.length ? (
            isQuestions.map((question, index) => (
              <Accordion
                key={question.id || `question-${index}`}
                id={question.id || `question-${index}`}
                trigger={question.question}
                content={question.answer}
              />
            ))
          ) : (
            <CardDescription>No Questions added yet.</CardDescription>
          )}
        </Loader>
      </CardContent>
    </Card>
  );
};

export default HelpDesk;

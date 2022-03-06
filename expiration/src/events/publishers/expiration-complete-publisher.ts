import { Subjects, Publisher, ExpirationCompleteEvent } from "@lsmticket/common";

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
    subjects: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
}
import { graphql } from "react-relay";
import { Environment } from "relay-runtime";

import { getViewer } from "coral-framework/helpers";
import { CoralContext } from "coral-framework/lib/bootstrap";
import {
  commitMutationPromiseNormalized,
  createMutation,
  MutationInput,
} from "coral-framework/lib/relay";
import { RemoveUserIgnoreEvent } from "coral-stream/events";

import { RemoveUserIgnoreMutation as MutationTypes } from "coral-stream/__generated__/RemoveUserIgnoreMutation.graphql";

let clientMutationId = 0;

const RemoveUserIgnoreMutation = createMutation(
  "removeUserIgnore",
  async (
    environment: Environment,
    input: MutationInput<MutationTypes>,
    { eventEmitter }: CoralContext
  ) => {
    const removeUserIgnore = RemoveUserIgnoreEvent.begin(eventEmitter, {
      userID: input.userID,
    });
    try {
      const result = await commitMutationPromiseNormalized<MutationTypes>(
        environment,
        {
          mutation: graphql`
            mutation RemoveUserIgnoreMutation($input: RemoveUserIgnoreInput!) {
              removeUserIgnore(input: $input) {
                clientMutationId
              }
            }
          `,
          variables: {
            input: {
              ...input,
              clientMutationId: (clientMutationId++).toString(),
            },
          },
          updater: (store) => {
            const viewer = getViewer(environment)!;
            const viewerProxy = store.get(viewer.id)!;
            const removeIgnoredUserRecords = viewerProxy.getLinkedRecords(
              "ignoredUsers"
            );
            if (removeIgnoredUserRecords) {
              viewerProxy.setLinkedRecords(
                removeIgnoredUserRecords.filter(
                  (r) => r.getValue("id") !== input.userID
                ),
                "ignoredUsers"
              );
            }
          },
        }
      );
      removeUserIgnore.success();
      return result;
    } catch (error) {
      removeUserIgnore.error({ message: error.message, code: error.code });
      throw error;
    }
  }
);

export default RemoveUserIgnoreMutation;

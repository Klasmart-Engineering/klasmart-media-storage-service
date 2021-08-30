#!/bin/sh

COMMITS=$(git log origin/${BITBUCKET_PR_DESTINATION_BRANCH}..$BITBUCKET_BRANCH --oneline --reverse | cut -d " " -f 1)
status=0
for COMMIT in $COMMITS
do
    MSG=$(git show --format="%B" -s $COMMIT)
    echo "$MSG" | npx commitlint -V || status=1

    if  [[ $MSG == wip:* ]]
    then
        status=1
        echo "The 'wip' commit type is permittable during development, but we're failing"
        echo "this PR pipeline to ensure it doesn't find its way into the destination branch."
    fi

    if  [[ $MSG == fixup!* ]]
    then
        status=1
        echo "'fixup!' is permittable during development, but we're failing"
        echo "this PR pipeline to ensure it doesn't find its way into the destination branch."
    fi
    echo ------------------
done
exit $status
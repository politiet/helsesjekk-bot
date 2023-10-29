import * as R from 'remeda'
import React, { ReactElement, Suspense } from 'react'

import { TeamNotAccesible, TeamNotFound } from '../../../../components/errors/ErrorMessages'
import { userHasAdGroup, verifyUserLoggedIn } from '../../../../auth/authentication'
import BackLink from '../../../../components/core/BackLink'
import { getTeamByAdGroup } from '../../../../db'
import { getTeamScorePerQuestion, getTeamScoreTimeline } from '../../../../db/score'
import OverallScoreGraph from '../../../../components/graphs/OverallScoreGraph'
import { getWeekNumber } from '../../../../utils/date'
import ScorePerQuestion from '../../../../components/graphs/ScorePerQuestion'

import { Heading, Skeleton, BodyLong, Detail } from 'aksel-server'

type Props = {
    params: {
        groupId: string
    }
}

async function Page({ params }: Props): Promise<ReactElement> {
    await verifyUserLoggedIn(`/team/${params.groupId}/graph`)

    if (!userHasAdGroup(params.groupId)) {
        return (
            <div>
                <BackLink href="/" />
                <TeamNotAccesible />
            </div>
        )
    }

    const team = await getTeamByAdGroup(params.groupId)
    if (!team) {
        return (
            <div>
                <BackLink href="/" />
                <TeamNotFound />
            </div>
        )
    }

    return (
        <div>
            <BackLink href={`/team/${params.groupId}`} />
            <Heading size="large">Helsegraf for {team.name}</Heading>
            <Suspense fallback={<Skeleton height={300} variant="rounded" />}>
                <OverallGraph teamId={team.id} />
            </Suspense>
            <Suspense fallback={<Skeleton height={300} variant="rounded" />}>
                <PerQuestionGraph teamId={team.id} />
            </Suspense>
        </div>
    )
}

async function OverallGraph({ teamId }: { teamId: string }): Promise<ReactElement> {
    const scoreTimeline = await getTeamScoreTimeline(teamId)

    if ('error' in scoreTimeline || scoreTimeline.length === 0) {
        return (
            <div className="max-w-prose mb-4">
                <Heading size="medium" level="3">
                    Total score per uke
                </Heading>
                <Heading size="medium" level="4" spacing>
                    Teamet ditt har ingen data
                </Heading>
                <BodyLong>
                    Det er ingen data å vise for teamet ditt. Dette kan skyldes at teamet ditt ikke har svart på noen
                    spørsmål enda.
                </BodyLong>
            </div>
        )
    }

    const earliest = R.minBy(scoreTimeline, (it) => it.timestamp.getTime())
    return (
        <div>
            <Heading size="medium" level="3">
                Total score per uke
            </Heading>
            <Detail>
                {scoreTimeline.length} målinger siden Uke {getWeekNumber(earliest.timestamp)},{' '}
                {earliest.timestamp.getFullYear()}
            </Detail>
            <div className="mt-4">
                <OverallScoreGraph data={scoreTimeline} />
            </div>
        </div>
    )
}

async function PerQuestionGraph({ teamId }: { teamId: string }): Promise<ReactElement> {
    const teamMetrics = await getTeamScorePerQuestion(teamId)

    if ('error' in teamMetrics) {
        return (
            <div className="max-w-prose mb-4">
                <Heading size="medium" level="3">
                    Score per spørsmål per uke
                </Heading>
                <Heading size="medium" level="3" spacing>
                    Teamet ditt har ingen data
                </Heading>
                <BodyLong>
                    Det er ingen data å vise for teamet ditt. Dette kan skyldes at teamet ditt ikke har svart på noen
                    spørsmål enda.
                </BodyLong>
            </div>
        )
    }

    const { scoredQuestions, maxQuestions, questions } = teamMetrics

    const earliest = R.minBy(scoredQuestions, (it) => it.timestamp.getTime())
    return (
        <div>
            <Heading size="medium" level="3">
                Score per spørsmål per uke
            </Heading>
            <Detail>
                {scoredQuestions.length} målinger siden Uke {getWeekNumber(earliest.timestamp)},{' '}
                {earliest.timestamp.getFullYear()}
            </Detail>
            <div className="mt-4">
                <ScorePerQuestion maxQuestions={maxQuestions} questions={questions} data={scoredQuestions} />
            </div>
        </div>
    )
}

export default Page
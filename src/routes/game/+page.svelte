<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { Fireworks } from '@fireworks-js/svelte'
    import type { FireworksOptions } from '@fireworks-js/svelte'
    import { game } from '$lib/stores/Game'
    import { settings } from '$lib/stores/Settings'
    import { goto } from '$app/navigation';
    import { equals, gt, sfx, sleep } from '$lib/utils/common'
    import { 
        compareFns,
        inFieldGoalRange, 
        isGameComplete,
        isModalChoice,
        makeFourthDownChoice,
        makePointChoice,
        primaryColor,
        secondaryColor,
        showDownDistance, 
    } from '$lib/utils/game'
    import { BALL_FIELD_GOAL, DOWN, GAME_ACTION, GAME_MODE, TEAM } from '$lib/constants/constants';
    import Dice from '$lib/components/Dice.svelte';
    import CoinToss from '$lib/components/modal/CoinToss.svelte';
    import Field from '$lib/components/Field.svelte';
	import FourthDown from '$lib/components/modal/FourthDown.svelte';
    import GameModal from '$lib/components/GameModal.svelte';
    import PointOption from '$lib/components/modal/PointOption.svelte';
    import Scores from '$lib/components/Scores.svelte';

    const {awayTeam, homeTeam, mode, winScore} = $settings;
    $: ({
        action, 
        ballIndex, 
        currentDown,
        firstDownIndex,
        lastPlay,
        missedKick, 
        onsideKick, 
        possession,
        restrictDice, 
        score,
        yardsToGo,
    } = $game);

    let fw: Fireworks
    let options: FireworksOptions = {
        explosion: 3,
        opacity: 0.5,
        intensity: 15,
        sound: {
            enabled: true,
            files: [
                'sfx/firework1.opus',
                'sfx/firework2.opus',
                'sfx/firework3.opus',
                'sfx/firework4.opus',
                'sfx/firework5.opus',
            ],
            volume: {
                min: 2,
                max: 4
            }
        }
    }

    onMount(() => {
        if(equals(awayTeam.id, 0) || equals(homeTeam.id, 0)){
            goto('/')
        }
    });

    onDestroy(() => {
        game.reset();
    })

    $: if(isGameComplete(score, winScore)){
        const winner = gt(score[1], score[0]) ? awayTeam.city : homeTeam.city
        game.gameComplete(winner);
        
    }
    
    $: game.handleNextAction(action, ballIndex, score, winScore);
    $: if(action === GAME_ACTION.GAME_OVER){
        sleep(100).then(() => {
            const fireworks = fw.fireworksInstance()
            fireworks.start()}
        );
    }

    //
    $: if(isModalChoice(mode, possession, action)){
            if(action === GAME_ACTION.POINT_OPTION){
                sleep(1000).then(() => {
                    sfx('button');
                    game.preparePointOption(makePointChoice(score, winScore));
                }
            );
        } else {
            sleep(1000).then(() => {
                const choiceAction = makeFourthDownChoice(score, ballIndex);
                sfx('button');               
                if(choiceAction === GAME_ACTION.FIELD_GOAL){
                    game.toggleFieldGoal();
                } else {
                    game.saveFourthDown(choiceAction)
                }
            }
        );
        }
    }
</script>

<main>
    <div class="game">
        <div class="controls">
            <div class="dice-container">
                <div class="action">{action}</div>
                <Dice
                    dieColor={primaryColor($settings, possession)} 
                    pipColor={secondaryColor($settings, possession)} 
                />
                {#if restrictDice || (mode === GAME_MODE.SOLO && possession === TEAM.AWAY)}
                    <div class="dice-block" />
                {/if}
            </div>
            <div class="scoreboard">
                <Scores {awayTeam} {homeTeam} {possession} {score} />
                {#if showDownDistance(action)}
                    <div class="down-to-go">
                        {DOWN[currentDown]} & {yardsToGo}
                    </div>
                {/if}
                <div class="last-play">
                    {lastPlay}
                </div>
            </div>
        </div>

        <Field 
            {awayTeam}
            {ballIndex}
            {firstDownIndex}
            {homeTeam}
            inFieldGoalRange={inFieldGoalRange(action, possession, ballIndex)}
            {missedKick}
            {onsideKick}
            {possession}
            toggleFieldGoal={game.toggleFieldGoal} 
        />
        {#if action === GAME_ACTION.GAME_OVER}
            <Fireworks bind:this={fw} autostart={false} {options} class="fireworks" />
        {/if}
    </div>

    <GameModal {action} on:click={game.clearModal}>
        <div class="model-content">
            {#if equals(action, GAME_ACTION.COIN_TOSS)}
                <CoinToss {awayTeam} {homeTeam} saveCoinToss={game.saveCoinToss} />
            {/if}
            {#if equals(action, GAME_ACTION.POINT_OPTION) && !equals(action, GAME_ACTION.GAME_OVER)}
                <PointOption savePointOption={game.preparePointOption} />
            {/if}
            {#if equals(action, GAME_ACTION.FOURTH_DOWN_OPTIONS)}
                <FourthDown 
                    inFieldGoalRange={compareFns[possession](ballIndex, BALL_FIELD_GOAL[possession])} 
                    saveFourthDown={game.saveFourthDown}
                    toggleFieldGoal={game.toggleFieldGoal}
                />
            {/if}
        </div>
    </GameModal>
</main>
<div class="exit-button">
    <button on:click={() => goto('/')}>RETURN TO SETTINGS</button>
</div>

<style>
    main {
        position: relative;
        padding: 1rem;
	}
    .game{
        max-width: 850px;
        min-width: 600px;
        margin: 0 auto;
    }
    .controls {
        display: flex;
        background-color: var(--smoke);
        padding: 1%;
        border-top-left-radius: 10px;
        border-top-right-radius: 10px;
    }
    .dice-container {
        display: flex;
        flex-direction: column;
        width: 176px;
        height: 116px;
    }
    .action {
        color: var(--white);
        font-family: var(--mono);
        line-height: 1.5rem;
        font-size: 18px;
        white-space: nowrap;
    }
    .dice-block {
        position: absolute;
        top: 0;
        height: 100%;
        width: 100%;
        background-color: var(--black);
        opacity: .2; 
    }
    .scoreboard {
        display: flex;
        flex-direction: column;
        width: 100%;
    }
    .down-to-go {
        text-align: center;
        font-size: 24px;
        font-family: var(--mono);
        color: var(--white);
    }
    .last-play {
        text-align: center;
        font-size: 20px;
        font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
        color: gold;
    }
    .exit-button {
        margin-top: 10px;
    }

    @media (min-width: 850px) {
        .controls {
            min-height: 132px;
        }
    }
    :global(.fireworks) {
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        position: fixed;
        background: transparent;
    }
</style>
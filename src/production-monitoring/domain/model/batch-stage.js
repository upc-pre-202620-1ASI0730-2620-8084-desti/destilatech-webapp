
export const BatchStage = Object.freeze({
    RECEIVED: 'RECEIVED',
    FERMENTATION: 'FERMENTATION',
    DISTILLATION: 'DISTILLATION',
    RESTING: 'RESTING',
    BOTTLED: 'BOTTLED'
});

export const BATCH_STAGE_SEQUENCE = Object.freeze([
    BatchStage.RECEIVED,
    BatchStage.FERMENTATION,
    BatchStage.DISTILLATION,
    BatchStage.RESTING,
    BatchStage.BOTTLED
]);


export const nextStageOf = stage => {
    const index = BATCH_STAGE_SEQUENCE.indexOf(stage);
    return index >= 0 && index < BATCH_STAGE_SEQUENCE.length - 1 ? BATCH_STAGE_SEQUENCE[index + 1] : null;
};

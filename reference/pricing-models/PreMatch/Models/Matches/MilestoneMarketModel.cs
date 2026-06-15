using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

public class MilestoneMarketModel : StandardMarketPricingModel
{
    private readonly string _marketName;
    private readonly string _marketCode;
    private readonly int _marketId;
    private readonly int _legacyMarketId;
    private readonly Func<IPricingInputs, double> _getProbability;
    private readonly Func<IPricingInputs, double> _getAdjustment;
    private readonly bool _includeInningsSpecifier;

    public MilestoneMarketModel(
        ILookupProvider lookupProvider,
        string marketName,
        string marketCode,
        int marketId,
        int legacyMarketId,
        Func<IPricingInputs, double> getProbability,
        Func<IPricingInputs, double> getAdjustment,
        bool includeInningsSpecifier
    ) : base(lookupProvider)
    {
        _marketName = marketName;
        _marketCode = marketCode;
        _marketId = marketId;
        _legacyMarketId = legacyMarketId;
        _getProbability = getProbability;
        _getAdjustment = getAdjustment;
        _includeInningsSpecifier = includeInningsSpecifier;
    }

    public override string GetMarketName() => _marketName;

    public override int GetMarketId() => _marketId;

    public override int GetLegacyMarketId() => _legacyMarketId;

    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var specifiers = new List<Specifier>();

        if (_includeInningsSpecifier)
            specifiers.Add(new InningsSpecifier(1));

        specifiers.Add(new MilestoneSpecifier(_marketName.Contains("Fifty") ? 50 : 100));
        specifiers.Add(new MaxOverSpecifier(inputs.MatchState.GetCurrentInnings().OversAvailable));

        var probability = _getProbability(inputs);
        var adjust = _getAdjustment(inputs);
        probability += adjust / 100;

        return new List<Market>
        {
            Market.CreateYesNo(GetMarketName(), GetMarketId(), GetLegacyMarketId(), probability, specifiers, _marketCode)
        };
    }
}

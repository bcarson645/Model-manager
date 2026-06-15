using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.HeadToHeads;

public class TeamOfTopBowl : MatchDerivativeMarket
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Team of Top Bowl";
    private const string MarketCode = "510BARUA";
    
    public TeamOfTopBowl(ILookupProvider lookupProvider) : base(lookupProvider)
    {
    }

    public override string GetMarketName() => MarketName;
    
    public override int GetMarketId() => 699;
    
    public override int GetLegacyMarketId() => 59;

    protected override Market CreateMarket(IPricingInputs inputs, Market matchMarket)
    {
        var (team1, team2) = GetTeams(inputs);
        var matchOdds = matchMarket.Outcomes;

        var homeTeam = inputs.Evaluation.MatchEvaluation.IsT10 || inputs.Evaluation.MatchEvaluation.IsT20
            ? 0.74 * matchOdds[0].Probability + 0.26 * matchOdds[1].Probability
            : 0.83 * matchOdds[0].Probability + 0.17 * matchOdds[1].Probability;

        homeTeam += inputs.AdjustmentsPM.MatchAdjustments.TeamOfTopBowl / 100;

        var specifiers = GetMaxOverSpecifier(inputs);
        var outcomes = GetTeamTwoWayOutcomes(team1.TeamName, team1.TeamId, homeTeam, team2.TeamName, team2.TeamId, 1 - homeTeam);
        
        return new Market(GetMarketName(), GetMarketId(), GetLegacyMarketId(), outcomes, specifiers, MarketCode);
    }
}

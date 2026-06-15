using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.HeadToHeads;

public class TeamOfTopBat : MatchDerivativeMarket
{
    // string constants to reduce possible code mutations
    private const string MarketName = "Team of Top Bat";
    private const string MarketCode = "59BARUA";
    
    public TeamOfTopBat(ILookupProvider lookupProvider) : base(lookupProvider)
    {
    }

    public override string GetMarketName() => MarketName;
    
    public override int GetMarketId() => 698;
    
    public override int GetLegacyMarketId() => 58;
    
    protected override Market CreateMarket(IPricingInputs inputs, Market matchMarket)
    {
        var (team1, team2) = GetTeams(inputs);
        var matchOdds = matchMarket.Outcomes;

        var homeTeam = 0.86 * matchOdds[0].Probability + 0.14 * matchOdds[1].Probability ;
        homeTeam += inputs.AdjustmentsPM.MatchAdjustments.TeamOfTopBat / 100;
        
        var specifiers = GetMaxOverSpecifier(inputs);
        var outcomes = GetTeamTwoWayOutcomes(team1.TeamName, team1.TeamId, homeTeam, team2.TeamName, team2.TeamId, 1 - homeTeam);
        
        return new Market(GetMarketName(), GetMarketId(), GetLegacyMarketId(), outcomes, specifiers, MarketCode);
    }
}

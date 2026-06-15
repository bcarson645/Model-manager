using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Outcomes;
using PremiumCricket.Lib.Models.PricingOutputs.Outcomes.TeamNoWinner;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Matches;

public class TossWinDouble : StandardMarketPricingModel
{
    private const string MarketName = "Toss/Win Double";
    private const string MarketCode = "TWD";
    
    public TossWinDouble(ILookupProvider lookupProvider) : base(lookupProvider)
    {
    }

    public override string GetMarketName() => MarketName;
        
    public override int GetMarketId() => 999;

    public override int GetLegacyMarketId() => 68;

    public override IList<Market> GetMarkets(IPricingInputs inputs)
    {
        var (team1, team2) = GetTeams(inputs);
        var homeMatchPrice = GetMatchOdds(inputs)[0].Probability;
        var awayMatchPrice = GetMatchOdds(inputs)[1].Probability;
        var tossValue = inputs.Evaluation.MatchEvaluation.TossValue;
            
        var homeTeamProb = homeMatchPrice * 0.5 + tossValue;
        var awayTeamProb = awayMatchPrice * 0.5 + tossValue;
        var noTeamProb = 1 - homeTeamProb - awayTeamProb;
            
        var outcomes = GetTeamTwoWayOutcomes(team1.TeamName, team1.TeamId, homeTeamProb, team2.TeamName, team2.TeamId, awayTeamProb);
        outcomes.Add(new NoWinnerOutcome(noTeamProb));
            
        return new List<Market>
        {
            new(GetMarketName(), GetMarketId(), GetLegacyMarketId(), outcomes, new List<Specifier>(), MarketCode)
        };
    }
        
    private Outcome[] GetMatchOdds(IPricingInputs inputs){
        var matchMarket = new MatchBetting(LookupProvider);
        return matchMarket.GetMatchOdds(inputs).ToArray();
    }
}

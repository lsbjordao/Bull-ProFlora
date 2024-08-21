attach(input[[1]])

linearRegression <- function(y){
  needs(ggtrendline)

  x <- seq(1985, by = 1, length.out = length(y))

  df <- data.frame(x, y)
  
  trendline_result <- trendline_sum(df$x, df$y, model = "line2P")
  annualRate <- trendline_result$parameter$a * 100 / length(df$x)
  pValue <- trendline_result$p.value
  rSquared <- trendline_result$R.squared

  results <- data.frame(
    annualRate,
    pValue,
    rSquared
  ) 
  
  return(results)
}

result <- linearRegression(y)
return(result)
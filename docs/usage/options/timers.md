# timers

```sh
  -t, --timers             add checkpoint and slide maximum time on notes view
```

The time, a precious ressource for a speaker.

SliDesk allows you to check your time with two manners.

## Checkpoint

```
//@ < 35:00
```

This syntax in your `.sdf` defines a checkpoint. In this example, when your current slide is display after 35 minutes of the start of your presentation, the clock will be displayed with a red background.

## Duration

```
//@ [] 02:00
```

This syntax allow to display a new clock which the time you want. Here, a 2 minutes clock will be shown. After the time specified, this clock will have a red background, to warn you you reach the limits.

![timers](./_media/timers.png)

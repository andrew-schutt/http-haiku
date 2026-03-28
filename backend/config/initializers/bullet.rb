if defined?(Bullet)
  Rails.application.configure do
    config.after_initialize do
      Bullet.enable        = true
      Bullet.bullet_logger = true  # log/bullet.log
      Bullet.rails_logger  = true

      Bullet.n_plus_one_query_enable     = true
      Bullet.unused_eager_loading_enable = true
      Bullet.counter_cache_enable        = true

      if Rails.env.test?
        Bullet.raise = true
      end
    end
  end
end

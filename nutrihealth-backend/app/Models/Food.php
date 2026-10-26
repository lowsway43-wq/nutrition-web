<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Food extends Model
{
    protected $table = 'foods';

    protected $fillable = [
        'name',
        'category',
        'serving_size',
        'serving_unit',
        'calories',
        'protein',
        'carbohydrates',
        'fat',
        'sugar',
        'sodium',
    ];
}
